import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter, { async } from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';
import Button from "react-bootstrap/Button";

import { format6FirstsAnd6LastsChar, formatDate } from "./utils";
import meta from "./assets/metamask.png";

import LSMContract from './artifacts/contracts/LoanStateMachine.sol/LoanStateMachine.json';

function App() {

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const [provider, setProvider] = useState();
  const [contract, setContract] = useState();
  const [signer, setSigner] = useState();

  const [state, setState] = useState('');
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [end, setEnd] = useState('');
  const [borrower, setBorrower] = useState('');
  const [lender, setLender] = useState('');


  const contractAddress = '0x01d2f1e45d395aEe8b200E2Fa9F7B40e2fA8FEdd';
  

  async function handleConnectWallet (){
    try {
      setLoading(true)
      let userAcc = await provider.send('eth_requestAccounts', []);
      setUser({account: userAcc[0], connected: true});

      const contrSig = new ethers.Contract(contractAddress, LSMContract.abi, provider.getSigner())
      setSigner( contrSig)

    } catch (error) {
      if (error.message == 'provider is undefined'){
        toastMessage('No provider detected.')
      } else if(error.code === -32002){
        toastMessage('Check your metamask')
      }
    } finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    
    async function getData() {
      try {
        const {ethereum} = window;
        if (!ethereum){
          toastMessage('Metamask not detected');
          return
        }
  
        const prov =  new ethers.providers.Web3Provider(window.ethereum);
        setProvider(prov);

        const contr = new ethers.Contract(contractAddress, LSMContract.abi, prov);
        setContract(contr);
        
        if (! await isGoerliTestnet()){
          toastMessage('Change to goerli testnet.')
          return;
        }

        //contract data
        setAmount((await contr.amount()).toString())
        setBorrower((await contr.borrower()).toString())
        let dateEnd =  (await contr.end()).toString()
        setEnd( formatDate( dateEnd))
        setInterest((await contr.interest()).toString())
        setLender((await contr.lender()).toString())
        let state = (await contr.state()).toString();
        if (state == 0 ){
          setState("Pending")
        } else if (state == 1 ){
          setState("Active")
        } else if (state == 2 ){
          setState("Closed")
        }  
  
        toastMessage('Data loaded')
        
      } catch (error) {
        toastMessage(error.reason)        
      }
      
    }

    getData()  
    
  }, [])
  
  function isConnected(){
    if (!user.connected){
      toastMessage('You are not connected!')
      return false;
    }
    
    return true;
  }

  async function isGoerliTestnet(){
    const goerliChainId = "0x5";
    const respChain = await getChain();
    return goerliChainId == respChain;
  }

  async function getChain() {
    const currentChainId = await  window.ethereum.request({method: 'eth_chainId'})
    return currentChainId;
  }

  async function handleDisconnect(){
    try {
      setUser({});
      setSigner(null);
    } catch (error) {
      toastMessage(error.reason)
    }
  }

  function toastMessage(text) {
    toast.info(text)  ;
  }

  async function executeSigner(func, successMessage){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await func;  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage(successMessage)
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
  }
  
  function handleFund(){
    if (signer === undefined){
      toastMessage("Please, connect your metamask")
      return
    }
    const func = signer.fund({value: amount})
    executeSigner(func, "Funded.")
  }

  function handleReimburse(){
    if (signer === undefined){
      toastMessage("Please, connect your metamask")
      return
    }
    const totalValue = Number( amount) + Number( interest);
    const func = signer.reimburse({value: totalValue});  
    executeSigner(func, "Reimbursed.")
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="LOAN STATE MACHINE" image={true} />
      <WRInfo chain="Goerli" testnet={true} />
      <WRContent>
        
        <h1>LOAN STATE MACHINE</h1>
        {loading && 
          <h1>Loading....</h1>
        }
        { !user.connected ?<>
            <Button className="commands" variant="btn btn-primary" onClick={handleConnectWallet}>
              <img src={meta} alt="metamask" width="30px" height="30px"/>Connect to Metamask
            </Button></>
          : <>
            <label>Welcome {format6FirstsAnd6LastsChar(user.account)}</label>
            <button className="btn btn-primary commands" onClick={handleDisconnect}>Disconnect</button>
          </>
        }

        <hr/>
        <h2>Contract data</h2>
        <label>State: {state}</label>
        <label>Amount: {amount}</label>
        <label>Interest: {interest}</label>
        <label>End: {end}</label>
        <label>Lender: {format6FirstsAnd6LastsChar(lender)}</label>
        <label>Borrower: {format6FirstsAnd6LastsChar(borrower)}</label>
        <hr/>

        <h2>Fund (only lender)</h2>
        <button className="btn btn-primary commands" onClick={handleFund}>Click to fund</button>
        <hr/>

        <h2>Reimburse (only borrower)</h2>
        <button className="btn btn-primary commands" onClick={handleReimburse}>Click to Reimburse</button>
        <hr/>
        
      </WRContent>
      <WRTools react={true} hardhat={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter /> 
    </div>
  );
}

export default App;
