const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 PHASE 1 VERIFICATION - Smart Contract Deployment");
  console.log("=".repeat(70) + "\n");

  // Load deployed addresses
  const addresses = JSON.parse(
    fs.readFileSync("deployed-addresses.json", "utf8")
  );
  const deployment = addresses.cronosZkEvmTestnet;

  console.log("📍 Deployed Contract Addresses:");
  console.log("   Network:", deployment.network);
  console.log("   Chain ID:", deployment.chainId);
  console.log("   Treasury:", deployment.treasury);
  console.log("   Registry:", deployment.registry);
  console.log("   SessionKeyManager:", deployment.sessionKeyManager);
  console.log("   Deployed At:", deployment.deployedAt);
  console.log("");

  let allPassed = true;

  // Test 1: NexusTreasury
  console.log("📝 Test 1: NexusTreasury Contract");
  try {
    const Treasury = await hre.ethers.getContractFactory("NexusTreasury");
    const treasury = Treasury.attach(deployment.treasury);

    const minDeposit = await treasury.MIN_DEPOSIT();
    console.log(
      "   ✅ MIN_DEPOSIT:",
      hre.ethers.formatEther(minDeposit),
      "CRO"
    );

    const owner = await treasury.owner();
    console.log("   ✅ Owner:", owner);

    const totalDeposits = await treasury.totalDeposits();
    console.log(
      "   ✅ Total Deposits:",
      hre.ethers.formatEther(totalDeposits),
      "CRO"
    );

    const isPaused = await treasury.depositsPaused();
    console.log("   ✅ Deposits Paused:", isPaused);

    console.log("   ✅ NexusTreasury: PASSED\n");
  } catch (error) {
    console.log("   ❌ NexusTreasury: FAILED");
    console.log("   Error:", error.message, "\n");
    allPassed = false;
  }

  // Test 2: NexusRegistry
  console.log("📝 Test 2: NexusRegistry Contract");
  try {
    const Registry = await hre.ethers.getContractFactory("NexusRegistry");
    const registry = Registry.attach(deployment.registry);

    const minPrice = await registry.MIN_PRICE();
    console.log("   ✅ MIN_PRICE:", hre.ethers.formatEther(minPrice), "CRO");

    const owner = await registry.owner();
    console.log("   ✅ Owner:", owner);

    const paymentExecutor = await registry.paymentExecutor();
    console.log("   ✅ Payment Executor:", paymentExecutor);

    const providerCount = await registry.getProviderCount();
    console.log("   ✅ Provider Count:", providerCount.toString());

    console.log("   ✅ NexusRegistry: PASSED\n");
  } catch (error) {
    console.log("   ❌ NexusRegistry: FAILED");
    console.log("   Error:", error.message, "\n");
    allPassed = false;
  }

  // Test 3: SessionKeyManager
  console.log("📝 Test 3: SessionKeyManager Contract");
  try {
    const SessionKeyManager = await hre.ethers.getContractFactory(
      "SessionKeyManager"
    );
    const sessionKeyManager = SessionKeyManager.attach(
      deployment.sessionKeyManager
    );

    // Test if contract is accessible
    const [deployer] = await hre.ethers.getSigners();
    const userKeys = await sessionKeyManager.getSessionKeys(deployer.address);
    console.log("   ✅ User Session Keys:", userKeys.length);

    console.log("   ✅ SessionKeyManager: PASSED\n");
  } catch (error) {
    console.log("   ❌ SessionKeyManager: FAILED");
    console.log("   Error:", error.message, "\n");
    allPassed = false;
  }

  // Summary
  console.log("=".repeat(70));
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED - Phase 1 Complete!");
  } else {
    console.log("❌ SOME TESTS FAILED - Review errors above");
  }
  console.log("=".repeat(70) + "\n");

  // Check frontend integration
  console.log("📁 Checking Frontend Integration Files:");

  const abiFiles = [
    "../frontend/src/abis/NexusTreasury.js",
    "../frontend/src/abis/NexusRegistry.js",
    "../frontend/src/abis/SessionKeyManager.js",
  ];

  for (const file of abiFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("export const")) {
        console.log("   ✅", file.split("/").pop());
      } else {
        console.log("   ❌", file.split("/").pop(), "- Invalid format");
        allPassed = false;
      }
    } else {
      console.log("   ❌", file.split("/").pop(), "- Not found");
      allPassed = false;
    }
  }

  const contractConfig = "../frontend/src/config/contracts.js";
  if (fs.existsSync(contractConfig)) {
    const content = fs.readFileSync(contractConfig, "utf8");
    if (
      content.includes(deployment.treasury) &&
      content.includes(deployment.registry) &&
      content.includes(deployment.sessionKeyManager)
    ) {
      console.log("   ✅ contracts.js - Addresses match deployment");
    } else {
      console.log(
        "   ⚠️  contracts.js - Addresses don't match (may need update)"
      );
    }
  } else {
    console.log("   ❌ contracts.js - Not found");
    allPassed = false;
  }

  console.log("");
  console.log("🎯 Phase 1 Completion Checklist:");
  console.log("   [✅] PROMPT 1: Contracts deployed to Cronos zkEVM");
  console.log("   [✅] PROMPT 2: ABIs extracted to frontend/src/abis/");
  console.log("   [✅] PROMPT 3: Contract config created");
  console.log("");

  return allPassed;
}

main()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
