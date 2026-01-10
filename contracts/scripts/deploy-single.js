const hre = require("hardhat");

async function main() {
  console.log("Deploying NexusTreasury to:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "CRO\n");

  // Deploy NexusTreasury with minimal gas limit
  console.log("Deploying NexusTreasury...");
  const NexusTreasury = await hre.ethers.getContractFactory("NexusTreasury");
  
  // Get gas estimation
  const deployTx = await NexusTreasury.getDeployTransaction();
  const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
  console.log("Estimated gas:", estimatedGas.toString());
  
  const feeData = await hre.ethers.provider.getFeeData();
  console.log("Max fee per gas:", hre.ethers.formatUnits(feeData.maxFeePerGas, "gwei"), "gwei");
  console.log("Estimated cost:", hre.ethers.formatEther(estimatedGas * feeData.maxFeePerGas), "CRO\n");
  
  const treasury = await NexusTreasury.deploy({ gasLimit: 1500000 });
  console.log("Transaction sent, waiting for confirmation...");
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("NexusTreasury deployed to:", treasuryAddress);
  
  const newBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Remaining balance:", hre.ethers.formatEther(newBalance), "CRO");
  console.log("Cost:", hre.ethers.formatEther(balance - newBalance), "CRO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
