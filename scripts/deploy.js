
const hre = require("hardhat");

async function main() {
  
  const LoanStateMachine = await hre.ethers.getContractFactory("LoanStateMachine");
  const loanStateMachine = await LoanStateMachine.deploy(10000, 100, 10, "0x909eFCa230d4FAA7A985F953E911003e3a4395b9", "0xc95c906C1A73cd7Ea3BB60aB60ab4eAD50159746");

  await loanStateMachine.deployed();

  console.log(
    `Loan State Machine deployed to ${loanStateMachine.address}`
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
