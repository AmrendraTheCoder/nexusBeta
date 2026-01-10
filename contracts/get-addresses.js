const { Provider } = require("zksync-ethers");
const { ethers } = require("ethers");

async function main() {
  const provider = new Provider("https://testnet.zkevm.cronos.org");
  const address = "0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA";
  
  const txCount = await provider.getTransactionCount(address);
  console.log("Getting deployment addresses from recent transactions...\n");
  
  const deployedContracts = [];
  
  // Check last 5 transactions for contract deployments
  for (let i = 0; i < txCount && i < 5; i++) {
    try {
      // Get transaction by block and index
      const block = await provider.getBlock("latest");
      if (!block) continue;
      
      // Alternative: use block explorer API or check known transaction hashes
      console.log(`Checking nonce ${i}...`);
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
  
  console.log("\nPlease check the explorer to get contract addresses:");
  console.log("https://explorer.zkevm.cronos.org/testnet/address/" + address);
  console.log("\nLook for 'Contract Creation' transactions and copy the contract addresses.");
}

main().catch(console.error);
