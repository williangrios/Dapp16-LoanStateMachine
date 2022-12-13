import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';

import LSMContract from './artifacts/contracts/LoanStateMachine.sol/LoanStateMachine.json';

function App() {

  const [userAccount, setUserAccount] = useState('');

  const [state, setState] = useState('');
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [end, setEnd] = useState('');
  const [borrower, setBorrower] = useState('');
  const [lender, setLender] = useState('');


  const addressContract = '0x01d2f1e45d395aEe8b200E2Fa9F7B40e2fA8FEdd';
  
  let contractDeployed = null;
  let contractDeployedSigner = null;
  
  async function getProvider(connect = false){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (contractDeployed == null){
      contractDeployed = new ethers.Contract(addressContract, LSMContract.abi, provider)
    }
    if (contractDeployedSigner == null){
      if (connect){
        let userAcc = await provider.send('eth_requestAccounts', []);
        setUserAccount(userAcc[0]);
      }
      contractDeployedSigner = new ethers.Contract(addressContract, LSMContract.abi, provider.getSigner());
    }
  }

  useEffect(() => {
    getData()
  }, [])

  async function disconnect(){
    try {
      setUserAccount('');
    } catch (error) {
      
    }
  }

  function formatDate(dateTimestamp){
    let date = new Date(parseInt(dateTimestamp));
    let dateFormatted = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + "  " + date.getHours() + ":" + date.getMinutes();
    return dateFormatted;
  }

  function toastMessage(text) {
    toast.info(text)  ;
  }

  function toTimestamp(strDate){
    var datum = Date.parse(strDate);
    return datum;
  }

  async function getData(connect = false) {
    await getProvider(connect);
    setAmount((await contractDeployed.amount()).toString())
    setBorrower((await contractDeployed.borrower()).toString())
    let dateEnd =  (await contractDeployed.end()).toString()
    setEnd( formatDate( dateEnd))
    setInterest((await contractDeployed.interest()).toString())
    setLender((await contractDeployed.lender()).toString())
    let state = (await contractDeployed.state()).toString();
    if (state == 0 ){
      setState("Pending")
    } else if (state == 1 ){
      setState("Active")
    } else if (state == 2 ){
      setState("Closed")
    }
    
  }

  async function handleFund(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.fund({value: amount});  
      console.log(resp);
      toastMessage("Funded.")
    } catch (error) {
      toastMessage(error.reason);
    }
  }

  async function handleReimburse(){
    await getProvider(true);
    try {
      const totalValue = parseInt( amount) + parseInt( interest);
      console.log(totalValue);
      const resp  = await contractDeployedSigner.reimburse({value: totalValue});  
      toastMessage("Reimbursed.")
    } catch (error) {
      toastMessage(error.reason);
    }
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="LOAN STATE MACHINE" image={true} />
      <WRInfo chain="Goerli testnet" />
      <WRContent>
        
        {
          userAccount =='' ?<>
            <h2>Connect your wallet</h2>
            <button onClick={() => getData(true)}>Connect</button>
          </>
          :(<>
            <h2>User data</h2>
            <p>User account: {userAccount}</p>
            <button onClick={disconnect}>Disconnect</button></>)
        }
        
        <hr/>
        <h2>Contract data</h2>
        <p>State: {state}</p>
        <p>Amount: {amount}</p>
        <p>Interest: {interest}</p>
        <p>End: {end}</p>
        <p>Lender: {lender}</p>
        <p>Borrower: {borrower}</p>

        
        <hr/>

        <h2>Fund</h2>
        <button onClick={handleFund}>Click to fund</button>
        <hr/>

        <h2>Reimburse</h2>
        <button onClick={handleReimburse}>Click to Reimburse</button>
        <hr/>
        
      </WRContent>
      <WRTools react={true} hardhat={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter /> 
    </div>
  );
}

export default App;
