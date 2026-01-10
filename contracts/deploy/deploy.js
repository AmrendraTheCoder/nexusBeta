const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-ethers");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Prevent duplicate execution
  const lockFile = path.join(__dirname, ".deploy.lock");
  if (fs.existsSync(lockFile)) {
    console.log("Deployment already in progress, skipping...");
    return;
  }
  
  try {
    fs.writeFileSync(lockFile, Date.now().toString());
    
    console.log("Deploying Nexus contracts to zkSync:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    
    // Initialize deployer wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY);
    const deployer = new Deployer(hre, wallet);
    
    console.log("Deploying with account:", wallet.address);
    
    const balance = await deployer.zkWallet.getBalance();
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy NexusTreasury
    console.log("Deploying NexusTreasury...");
    const NexusTreasury = await deployer.loadArtifact("NexusTreasury");
    const treasury = await deployer.deploy(NexusTreasury);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log("NexusTreasury deployed to:", treasuryAddress);

    // Deploy NexusRegistry
    console.log("\nDeploying NexusRegistry...");
    const NexusRegistry = await deployer.loadArtifact("NexusRegistry");
    const registry = await deployer.deploy(NexusRegistry);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("NexusRegistry deployed to:", registryAddress);

    // Deploy SessionKeyManager
    console.log("\nDeploying SessionKeyManager...");
    const SessionKeyManager = await deployer.loadArtifact("SessionKeyManager");
    const sessionKeyManager = await deployer.deploy(SessionKeyManager);
    await sessionKeyManager.waitForDeployment();
    const sessionKeyManagerAddress = await sessionKeyManager.getAddress();
    console.log("SessionKeyManager deployed to:", sessionKeyManagerAddress);

    // Summary
    console.log("\n========================================");
    console.log("Deployment Complete!");
    console.log("========================================");
    console.log("Network:", hre.network.name);
    console.log("NexusTreasury:", treasuryAddress);
    console.log("NexusRegistry:", registryAddress);
    console.log("SessionKeyManager:", sessionKeyManagerAddress);
    console.log("========================================\n");

    // Save deployment addresses
    const deploymentData = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      treasury: treasuryAddress,
      registry: registryAddress,
      sessionKeyManager: sessionKeyManagerAddress,
      deployedAt: new Date().toISOString(),
    };
    
    const addressesFile = path.join(__dirname, "../deployed-addresses.json");
    let allDeployments = {};
    if (fs.existsSync(addressesFile)) {
      allDeployments = JSON.parse(fs.readFileSync(addressesFile, "utf8"));
    }
    allDeployments["cronosZkEvmTestnet"] = deploymentData;
    fs.writeFileSync(addressesFile, JSON.stringify(allDeployments, null, 2));
    console.log("Deployment addresses saved to deployed-addresses.json");
    
    return deploymentData;
  } finally {
    // Remove lock file
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
}

module.exports = main;
