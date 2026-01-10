const hre = require("hardhat");

async function main() {
  console.log("Deploying Nexus contracts to:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy NexusTreasury
  console.log("Deploying NexusTreasury...");
  const NexusTreasury = await hre.ethers.getContractFactory("NexusTreasury");
  const treasury = await NexusTreasury.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("NexusTreasury deployed to:", treasuryAddress);

  // Deploy NexusRegistry
  console.log("\nDeploying NexusRegistry...");
  const NexusRegistry = await hre.ethers.getContractFactory("NexusRegistry");
  const registry = await NexusRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("NexusRegistry deployed to:", registryAddress);
  // Deploy SessionKeyManager
  console.log("\nDeploying SessionKeyManager...");
  const SessionKeyManager = await hre.ethers.getContractFactory("SessionKeyManager");
  const sessionKeyManager = await SessionKeyManager.deploy({ 
  // Deploy SessionKeyManager
  console.log("\nDeploying SessionKeyManager...");
  const SessionKeyManager = await hre.ethers.getContractFactory("SessionKeyManager");
  const sessionKeyManager = await SessionKeyManager.deploy();
  await sessionKeyManager.waitForDeployment();
  const sessionKeyManagerAddress = await sessionKeyManager.getAddress();
  console.log("SessionKeyManager deployed to:", sessionKeyManagerAddress);
  console.log("Deployment Complete!");
  console.log("========================================");
  console.log("Network:", hre.network.name);
  console.log("NexusTreasury:", treasuryAddress);
  console.log("NexusRegistry:", registryAddress);
  console.log("SessionKeyManager:", sessionKeyManagerAddress);
  console.log("========================================\n");

  // Return addresses for multi-chain script
  return {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    treasury: treasuryAddress,
    registry: registryAddress,
    sessionKeyManager: sessionKeyManagerAddress,
  };
}

main()
  .then((result) => {
    console.log("Deployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

module.exports = main;
