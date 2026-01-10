const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const NETWORKS = [
  { name: "cronosZkEvmTestnet", displayName: "Cronos zkEVM Testnet", chainId: 240 },
  { name: "baseSepolia", displayName: "Base Sepolia", chainId: 84532 },
  { name: "polygonAmoy", displayName: "Polygon Amoy", chainId: 80002 },
  { name: "sepolia", displayName: "Ethereum Sepolia", chainId: 11155111 },
];

const results = {};

async function deployToNetwork(network) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Deploying to ${network.displayName} (Chain ID: ${network.chainId})`);
  console.log("=".repeat(60));

  try {
    const output = execSync(
      `npx hardhat run scripts/deploy.js --network ${network.name}`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    console.log(output);

    // Parse addresses from output
    const treasuryMatch = output.match(/NexusTreasury deployed to: (0x[a-fA-F0-9]{40})/);
    const registryMatch = output.match(/NexusRegistry deployed to: (0x[a-fA-F0-9]{40})/);

    if (treasuryMatch && registryMatch) {
      results[network.name] = {
        chainId: network.chainId,
        displayName: network.displayName,
        treasury: treasuryMatch[1],
        registry: registryMatch[1],
        deployedAt: new Date().toISOString(),
        status: "success",
      };
      console.log(`✅ ${network.displayName} deployment successful!`);
    } else {
      throw new Error("Could not parse contract addresses from output");
    }
  } catch (error) {
    console.error(`❌ ${network.displayName} deployment failed:`, error.message);
    results[network.name] = {
      chainId: network.chainId,
      displayName: network.displayName,
      status: "failed",
      error: error.message,
    };
  }
}

async function main() {
  console.log("\n🚀 NEXUS MULTI-CHAIN DEPLOYMENT 🚀");
  console.log("===================================\n");

  // Deploy to each network
  for (const network of NETWORKS) {
    await deployToNetwork(network);
  }

  // Save results to JSON file
  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Deployment addresses saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));

  for (const [networkName, data] of Object.entries(results)) {
    if (data.status === "success") {
      console.log(`\n✅ ${data.displayName} (${data.chainId})`);
      console.log(`   Treasury: ${data.treasury}`);
      console.log(`   Registry: ${data.registry}`);
    } else {
      console.log(`\n❌ ${data.displayName} (${data.chainId})`);
      console.log(`   Error: ${data.error}`);
    }
  }

  console.log("\n" + "=".repeat(60));

  // Check if any deployments failed
  const failed = Object.values(results).filter((r) => r.status === "failed");
  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length}/${NETWORKS.length} deployments failed.`);
    console.log("Check your wallet balance and RPC connections.\n");
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${NETWORKS.length} deployments successful!\n`);
    process.exit(0);
  }
}

main();
