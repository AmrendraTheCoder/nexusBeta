/**
 * @fileoverview Centralized Contract Configuration
 * Single source of truth for all Nexus smart contract addresses across different chains
 * 
 * @author Nexus Team
 * @version 1.0.0
 */

// ============================================================================
// TYPE DEFINITIONS (for JSDoc autocomplete)
// ============================================================================

/**
 * @typedef {Object} NativeCurrency
 * @property {string} name - Full name of the native currency
 * @property {string} symbol - Symbol of the native currency
 * @property {number} decimals - Number of decimals (typically 18)
 */

/**
 * @typedef {Object} ChainConfig
 * @property {number} chainId - Chain ID number
 * @property {string} name - Human-readable chain name
 * @property {string} treasury - NexusTreasury contract address
 * @property {string} registry - NexusRegistry contract address
 * @property {string} sessionKeyManager - SessionKeyManager contract address
 * @property {string} rpc - RPC endpoint URL
 * @property {string} explorer - Block explorer base URL
 * @property {NativeCurrency} nativeCurrency - Native currency information
 * @property {string} [deployedAt] - Deployment timestamp (ISO string)
 * @property {string} [deployer] - Deployer wallet address
 */

// ============================================================================
// DEPLOYED CONTRACT ADDRESSES
// ============================================================================

/**
 * Contract addresses organized by chain ID
 * @type {Object.<number, ChainConfig>}
 */
export const CONTRACTS = {
  // Cronos zkEVM Testnet (Primary Network)
  240: {
    chainId: 240,
    name: "Cronos zkEVM Testnet",
    treasury: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
    registry: "0xe821fAbc3d23790596669043b583e931d8fC2710",
    sessionKeyManager: "0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2",
    rpc: "https://testnet.zkevm.cronos.org",
    explorer: "https://explorer.zkevm.cronos.org/testnet",
    nativeCurrency: {
      name: "Cronos zkEVM Test Token",
      symbol: "zkTCRO",
      decimals: 18
    },
    deployedAt: "2025-12-19T06:00:55.141Z",
    deployer: "0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA"
  },

  // Base Sepolia Testnet (Future Support)
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    treasury: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    registry: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    sessionKeyManager: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18
    }
  },

  // Polygon Amoy Testnet (Future Support)
  80002: {
    chainId: 80002,
    name: "Polygon Amoy",
    treasury: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    registry: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    sessionKeyManager: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    rpc: "https://rpc-amoy.polygon.technology",
    explorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "Polygon",
      symbol: "POL",
      decimals: 18
    }
  },

  // Ethereum Sepolia Testnet (Future Support)
  11155111: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    treasury: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    registry: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    sessionKeyManager: "0x0000000000000000000000000000000000000000", // TODO: Deploy
    rpc: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18
    }
  }
};

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default chain ID (Cronos zkEVM Testnet)
 * @constant {number}
 */
export const DEFAULT_CHAIN_ID = 240;

/**
 * List of supported chain IDs
 * @constant {number[]}
 */
export const SUPPORTED_CHAIN_IDS = Object.keys(CONTRACTS).map(Number);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get contract configuration for a specific chain
 * @param {number} chainId - The chain ID to get contracts for
 * @returns {ChainConfig} Chain configuration with all contract addresses
 * @example
 * const config = getContracts(240);
 * console.log(config.treasury); // "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7"
 */
export function getContracts(chainId) {
  // Handle undefined or null chainId
  if (!chainId || chainId === undefined) {
    return CONTRACTS[DEFAULT_CHAIN_ID];
  }
  
  const config = CONTRACTS[chainId];
  
  if (!config) {
    // Only warn if it's not the default chain (avoid spam during initial load)
    if (chainId !== DEFAULT_CHAIN_ID) {
      console.warn(`[Contracts] Chain ID ${chainId} not supported, using default chain ${DEFAULT_CHAIN_ID}`);
    }
    return CONTRACTS[DEFAULT_CHAIN_ID];
  }
  
  return config;
}

/**
 * Get a specific contract address for a given chain
 * @param {number} chainId - The chain ID
 * @param {'treasury' | 'registry' | 'sessionKeyManager'} contractName - Name of the contract
 * @returns {string} Contract address
 * @throws {Error} If contract name is invalid
 * @example
 * const treasuryAddress = getContractAddress(240, 'treasury');
 * // Returns: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7"
 */
export function getContractAddress(chainId, contractName) {
  const validContracts = ['treasury', 'registry', 'sessionKeyManager'];
  
  if (!validContracts.includes(contractName)) {
    throw new Error(`Invalid contract name: ${contractName}. Must be one of: ${validContracts.join(', ')}`);
  }
  
  const config = getContracts(chainId);
  const address = config[contractName];
  
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    console.warn(`Contract ${contractName} not deployed on chain ${chainId}`);
  }
  
  return address;
}

/**
 * Get the complete chain configuration including RPC, explorer, etc.
 * @param {number} chainId - The chain ID
 * @returns {ChainConfig} Complete chain configuration
 * @example
 * const chainConfig = getCurrentChainConfig(240);
 * console.log(chainConfig.name); // "Cronos zkEVM Testnet"
 * console.log(chainConfig.rpc); // "https://testnet.zkevm.cronos.org"
 */
export function getCurrentChainConfig(chainId) {
  return getContracts(chainId);
}

/**
 * Check if a chain is supported
 * @param {number} chainId - The chain ID to check
 * @returns {boolean} True if chain is supported
 * @example
 * if (isChainSupported(240)) {
 *   console.log('Cronos zkEVM is supported!');
 * }
 */
export function isChainSupported(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

/**
 * Check if contracts are deployed on a chain
 * @param {number} chainId - The chain ID to check
 * @returns {boolean} True if all contracts are deployed (not zero address)
 * @example
 * if (areContractsDeployed(240)) {
 *   console.log('All contracts deployed on Cronos zkEVM');
 * }
 */
export function areContractsDeployed(chainId) {
  const config = CONTRACTS[chainId];
  if (!config) return false;
  
  const { treasury, registry, sessionKeyManager } = config;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  
  return treasury !== zeroAddress && 
         registry !== zeroAddress && 
         sessionKeyManager !== zeroAddress;
}

/**
 * Get base explorer URL for a chain (without address/tx)
 * @param {number} chainId - The chain ID
 * @returns {string} Base explorer URL
 * @example
 * const url = getExplorerBaseUrl(240);
 * // Returns: "https://explorer.zkevm.cronos.org/testnet"
 */
export function getExplorerBaseUrl(chainId) {
  const config = getContracts(chainId);
  return config.explorer;
}

/**
 * Get explorer URL for a specific address on a chain
 * @param {number} chainId - The chain ID
 * @param {string} address - The address to view
 * @param {'address' | 'tx' | 'block'} [type='address'] - Type of explorer page
 * @returns {string} Full explorer URL
 * @example
 * const url = getExplorerUrl(240, '0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7');
 * // Returns: "https://explorer.zkevm.cronos.org/testnet/address/0x86c83A39..."
 */
export function getExplorerUrl(chainId, address, type = 'address') {
  const baseUrl = getExplorerBaseUrl(chainId);
  return `${baseUrl}/${type}/${address}`;
}

/**
 * Get all contract addresses for a chain as an object
 * @param {number} chainId - The chain ID
 * @returns {{treasury: string, registry: string, sessionKeyManager: string}} Object with all contract addresses
 * @example
 * const { treasury, registry, sessionKeyManager } = getAllContractAddresses(240);
 */
export function getAllContractAddresses(chainId) {
  const config = getContracts(chainId);
  
  return {
    treasury: config.treasury,
    registry: config.registry,
    sessionKeyManager: config.sessionKeyManager
  };
}

/**
 * Get chain name by chain ID
 * @param {number} chainId - The chain ID
 * @returns {string} Human-readable chain name
 * @example
 * const name = getChainName(240); // "Cronos zkEVM Testnet"
 */
export function getChainName(chainId) {
  const config = getContracts(chainId);
  return config.name;
}

/**
 * Get RPC URL for a chain
 * @param {number} chainId - The chain ID
 * @returns {string} RPC endpoint URL
 * @example
 * const rpc = getRpcUrl(240); // "https://testnet.zkevm.cronos.org"
 */
export function getRpcUrl(chainId) {
  const config = getContracts(chainId);
  return config.rpc;
}

/**
 * Get native currency information for a chain
 * @param {number} chainId - The chain ID
 * @returns {NativeCurrency} Native currency details
 * @example
 * const currency = getNativeCurrency(240);
 * console.log(currency.symbol); // "zkCRO"
 */
export function getNativeCurrency(chainId) {
  const config = getContracts(chainId);
  return config.nativeCurrency;
}

// ============================================================================
// EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Quick access to Cronos zkEVM contracts (most commonly used)
 * @constant
 */
export const CRONOS_CONTRACTS = CONTRACTS[240];

/**
 * Default contracts (alias for Cronos zkEVM)
 * @constant
 */
export const DEFAULT_CONTRACTS = CRONOS_CONTRACTS;

// Default export
export default CONTRACTS;
