/**
 * @deprecated This file is deprecated. Use the centralized configuration instead:
 * 
 * Instead of:
 *   import { DEPLOYED_CONTRACTS } from './constants/deployedContracts.js';
 * 
 * Use:
 *   import { CONTRACTS, getContracts } from './config/contracts.js';
 * 
 * Migration guide:
 *   DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury → getContractAddress(240, 'treasury')
 *   DEPLOYED_CONTRACTS.cronosZkEvmTestnet → getContracts(240)
 */

// Re-export from the new centralized configuration for backward compatibility
export {
  CONTRACTS as DEPLOYED_CONTRACTS,
  getContractAddress,
  getAllContractAddresses as getNetworkContracts,
  CONTRACTS as default
} from '../config/contracts.js';

// Legacy compatibility - maps old network names to chain IDs
export const NETWORK_TO_CHAIN_ID = {
  cronosZkEvmTestnet: 240,
  baseSepolia: 84532,
  polygonAmoy: 80002,
  ethereumSepolia: 11155111
};

/**
 * @deprecated Use getContracts(240) from config/contracts.js instead
 */
export const cronosZkEvmTestnet = {
  chainId: 240,
  network: "Cronos zkEVM Testnet",
  rpcUrl: "https://testnet.zkevm.cronos.org",
  explorer: "https://explorer.zkevm.cronos.org/testnet",
  treasury: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
  registry: "0xe821fAbc3d23790596669043b583e931d8fC2710",
  sessionKeyManager: "0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2",
  deployer: "0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA",
  deployedAt: "2025-12-19T06:00:55.141Z"
};
