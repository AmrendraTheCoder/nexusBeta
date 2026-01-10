const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ChimeraDelegate contract
 * This contract is used by the D8N Engine for batch transaction execution
 */
async function main() {
  console.log("🚀 Deploying ChimeraDelegate contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy ChimeraDelegate
  console.log("📦 Deploying ChimeraDelegate...");
  const ChimeraDelegate = await hre.ethers.getContractFactory("ChimeraDelegate");
  const delegate = await ChimeraDelegate.deploy();
  await delegate.waitForDeployment();

  const delegateAddress = await delegate.getAddress();
  console.log("✅ ChimeraDelegate deployed to:", delegateAddress);

  // Update deployed-addresses.json
  const addressesPath = path.join(__dirname, "../deployed-addresses.json");
  let addresses = {};
  
  if (fs.existsSync(addressesPath)) {
    const data = fs.readFileSync(addressesPath, "utf8");
    addresses = JSON.parse(data);
  }

  const network = hre.network.name;
  if (!addresses[network]) {
    addresses[network] = {};
  }

  addresses[network].chimeraDelegate = delegateAddress;
  addresses[network].deployedAt = new Date().toISOString();

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("📝 Updated deployed-addresses.json\n");

  // Wait for block confirmations before verification
  console.log("⏳ Waiting for block confirmations...");
  await delegate.deploymentTransaction().wait(5);

  // Verify contract on block explorer
  try {
    console.log("🔍 Verifying contract on block explorer...");
    await hre.run("verify:verify", {
      address: delegateAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully");
  } catch (error) {
    console.log("⚠️  Verification failed:", error.message);
    console.log("   You can verify manually later with:");
    console.log(`   npx hardhat verify --network ${network} ${delegateAddress}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("ChimeraDelegate:", delegateAddress);
  console.log("Network:", network);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
