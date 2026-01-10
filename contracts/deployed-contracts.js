// Deployed Nexus Smart Contracts on Cronos zkEVM Testnet
// Auto-generated from deployment on December 19, 2025

export const DEPLOYED_CONTRACTS = {
  cronosZkEvmTestnet: {
    chainId: 240,
    network: "Cronos zkEVM Testnet",
    rpcUrl: "https://testnet.zkevm.cronos.org",
    explorer: "https://explorer.zkevm.cronos.org/testnet",
    
    // Contract Addresses
    treasury: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
    registry: "0xe821fAbc3d23790596669043b583e931d8fC2710",
    sessionKeyManager: "0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2",
    
    // Deployer
    deployer: "0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA",
    deployedAt: "2025-12-19T06:00:55.141Z"
  }
};

// Helper to get contract address by network and contract name
export function getContractAddress(network, contractName) {
  const networkConfig = DEPLOYED_CONTRACTS[network];
  if (!networkConfig) {
    throw new Error(`Network ${network} not found in deployed contracts`);
  }
  
  const address = networkConfig[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not found on network ${network}`);
  }
  
  return address;
}

// Helper to get all addresses for a network
export function getNetworkContracts(network) {
  const networkConfig = DEPLOYED_CONTRACTS[network];
  if (!networkConfig) {
    throw new Error(`Network ${network} not found in deployed contracts`);
  }
  
  return {
    treasury: networkConfig.treasury,
    registry: networkConfig.registry,
    sessionKeyManager: networkConfig.sessionKeyManager
  };
}

// Default export for direct import
export default DEPLOYED_CONTRACTS;
