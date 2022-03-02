const { ethers } = require("hardhat");

async function main() {
    //Defining the Mumbai Testnet Variables
    let protcolPerc = 100;
    let tokenName = "Comrade Token";
    let tokenSymbol = "COMRADE";

    const [deployer, protocol] = await ethers.getSigners();
    let protocolWallet = protocol.address;
  
    console.log("Deploying contracts with the account:", deployer.address);

    const token = await ethers.getContractFactory("ComradeToken");
    const Token = await token.deploy(protocolPerc, protocolWallet, tokenName, tokenSymbol);

    console.log("Faucet address: ", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
  });