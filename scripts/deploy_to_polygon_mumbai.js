const { ethers } = require("hardhat");

async function main() {
    //Defining the Mumbai Testnet Variables
    let protocolPerc = 100;
    let tokenName = "Comrade Token";
    let tokenSymbol = "COMRADE";

    const [deployer, protocol] = await ethers.getSigners();
    let protocolWallet = protocol.address;
  
    console.log("Deploying contracts with the account:", deployer.address);

    const token = await ethers.getContractFactory("ComradeToken");
    const Token = await token.deploy(protocolPerc, protocolWallet, tokenName, tokenSymbol);

    console.log("Token address: ", Token.address);

    let tokenDistributionList = [
        "0x510d1bd177E1f6062317E377F0A9CEBe91BC8FBb",
        "0xD9cAcC43Be8dC29fF0C82AE4ffD199FE09582ae5",
        "0xa2e52f63662b34103fd92D1e865D6191171E7f84",
        "0x5B9D877Cc5c7510E1D96Fbb8f693c306341CD0De",
        "0x9518dCa3296d22FFC6860E65659023c7857721bE",
        "0x2A9d8CfD86796E6A68AF9c83FD90F67CcaF1352c",
        "0x147a0B6E848109D438445bA750645bCc37CbA825",
        "0xb15A3D29eFe51baaC8d3cd2f4F747B843FeAdA7d",
        "0x0cf275aBdF3d9F0cF2852FFbbDa16669ad2a1684",
        "0x485bce55a9152753De9a92477167Ff337e5926ca",
        "0x749dEAfb280750C05523EB6f8c1a71bAb399951C"
    ]
    for (let i = 0; i < tokenDistributionList.length; i++) {
        await Token.transfer(tokenDistributionList[i], ethers.utils.parseEther("10000"));
        console.log("Distributed 10,000 COMRADE to: ", tokenDistributionList[i]);
    }

    await Token.addExemptAddress(protocolWallet);
    console.log("protocolWallet with Exemption: ", protocolWallet)
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
  });