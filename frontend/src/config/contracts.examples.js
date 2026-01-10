/**
 * Contract Configuration - Usage Examples
 * 
 * This file demonstrates all the ways to use the centralized contract configuration
 */

// ============================================================================
// BASIC IMPORTS
// ============================================================================

import { 
  CONTRACTS,
  getContracts,
  getContractAddress,
  getCurrentChainConfig,
  isChainSupported,
  areContractsDeployed,
  getExplorerUrl,
  getAllContractAddresses,
  getChainName,
  getRpcUrl,
  getNativeCurrency,
  CRONOS_CONTRACTS,
  DEFAULT_CHAIN_ID,
  SUPPORTED_CHAIN_IDS
} from './contracts.js';

// ============================================================================
// EXAMPLE 1: Basic Usage - Get All Contracts for a Chain
// ============================================================================

function Example1_BasicUsage() {
  // Get all contract info for Cronos zkEVM (chain ID 240)
  const cronosContracts = getContracts(240);
  
  console.log('Chain Name:', cronosContracts.name);
  console.log('Treasury:', cronosContracts.treasury);
  console.log('Registry:', cronosContracts.registry);
  console.log('SessionKeyManager:', cronosContracts.sessionKeyManager);
  console.log('RPC:', cronosContracts.rpc);
  console.log('Explorer:', cronosContracts.explorer);
  
  // Or use the direct constant for Cronos
  const { treasury, registry, sessionKeyManager } = CRONOS_CONTRACTS;
}

// ============================================================================
// EXAMPLE 2: Get Specific Contract Address
// ============================================================================

function Example2_SpecificContract() {
  // Get just the treasury address on Cronos
  const treasuryAddress = getContractAddress(240, 'treasury');
  
  // Get registry address
  const registryAddress = getContractAddress(240, 'registry');
  
  // Get session key manager address
  const skmAddress = getContractAddress(240, 'sessionKeyManager');
  
  console.log('Treasury:', treasuryAddress);
  console.log('Registry:', registryAddress);
  console.log('Session Key Manager:', skmAddress);
}

// ============================================================================
// EXAMPLE 3: Using with Wagmi (React Hooks)
// ============================================================================

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { nexusTreasuryAbi } from '../abis/NexusTreasury.js';

function Example3_WagmiIntegration() {
  const { chainId } = useAccount();
  
  // Get contract address based on connected chain
  const treasuryAddress = getContractAddress(chainId || DEFAULT_CHAIN_ID, 'treasury');
  
  // Read from contract
  const { data: minDeposit } = useReadContract({
    address: treasuryAddress,
    abi: nexusTreasuryAbi,
    functionName: 'MIN_DEPOSIT',
  });
  
  // Write to contract
  const { writeContract } = useWriteContract();
  
  const handleDeposit = (amount) => {
    writeContract({
      address: treasuryAddress,
      abi: nexusTreasuryAbi,
      functionName: 'deposit',
      value: amount,
    });
  };
  
  return null;
}

// ============================================================================
// EXAMPLE 4: Using with ethers.js
// ============================================================================

import { ethers } from 'ethers';
import { nexusRegistryAbi } from '../abis/NexusRegistry.js';

async function Example4_EthersIntegration(chainId = 240) {
  // Get RPC URL for the chain
  const rpcUrl = getRpcUrl(chainId);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Get registry address
  const registryAddress = getContractAddress(chainId, 'registry');
  
  // Create contract instance
  const registry = new ethers.Contract(
    registryAddress,
    nexusRegistryAbi,
    provider
  );
  
  // Read from contract
  const providers = await registry.getActiveProviders();
  console.log('Active providers:', providers);
  
  return providers;
}

// ============================================================================
// EXAMPLE 5: Chain Validation and Fallback
// ============================================================================

function Example5_ChainValidation(userChainId) {
  // Check if chain is supported
  if (!isChainSupported(userChainId)) {
    console.warn(`Chain ${userChainId} not supported. Using default chain.`);
    userChainId = DEFAULT_CHAIN_ID;
  }
  
  // Check if contracts are deployed on this chain
  if (!areContractsDeployed(userChainId)) {
    console.error(`Contracts not deployed on chain ${userChainId}`);
    return null;
  }
  
  // Safe to use contracts
  const contracts = getContracts(userChainId);
  return contracts;
}

// ============================================================================
// EXAMPLE 6: Explorer Links
// ============================================================================

function Example6_ExplorerLinks(chainId = 240) {
  const { treasury, registry, sessionKeyManager } = getAllContractAddresses(chainId);
  
  // Get explorer URLs for all contracts
  const treasuryUrl = getExplorerUrl(chainId, treasury, 'address');
  const registryUrl = getExplorerUrl(chainId, registry, 'address');
  const skmUrl = getExplorerUrl(chainId, sessionKeyManager, 'address');
  
  console.log('View Treasury on Explorer:', treasuryUrl);
  console.log('View Registry on Explorer:', registryUrl);
  console.log('View SessionKeyManager on Explorer:', skmUrl);
  
  // Get transaction URL
  const txHash = '0xabc123...';
  const txUrl = getExplorerUrl(chainId, txHash, 'tx');
  console.log('View Transaction:', txUrl);
}

// ============================================================================
// EXAMPLE 7: Dynamic Chain Switching in React
// ============================================================================

import { useState, useEffect } from 'react';

function Example7_DynamicChainSwitching() {
  const { chainId } = useAccount();
  const [contracts, setContracts] = useState(CRONOS_CONTRACTS);
  const [chainInfo, setChainInfo] = useState(null);
  
  useEffect(() => {
    if (chainId) {
      // Update contracts when chain changes
      const newContracts = getContracts(chainId);
      setContracts(newContracts);
      
      // Get chain info
      const chainName = getChainName(chainId);
      const currency = getNativeCurrency(chainId);
      const deployed = areContractsDeployed(chainId);
      
      setChainInfo({
        name: chainName,
        currency: currency.symbol,
        deployed
      });
    }
  }, [chainId]);
  
  return (
    <div>
      <h2>Current Chain: {chainInfo?.name}</h2>
      <p>Currency: {chainInfo?.currency}</p>
      <p>Contracts Deployed: {chainInfo?.deployed ? 'Yes' : 'No'}</p>
      <p>Treasury: {contracts.treasury}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Batch Operations
// ============================================================================

async function Example8_BatchOperations(chainId = 240) {
  // Get all necessary info in one go
  const config = getCurrentChainConfig(chainId);
  const allAddresses = getAllContractAddresses(chainId);
  const chainName = getChainName(chainId);
  const rpcUrl = getRpcUrl(chainId);
  const currency = getNativeCurrency(chainId);
  
  console.log('=== Chain Configuration ===');
  console.log('Name:', chainName);
  console.log('RPC:', rpcUrl);
  console.log('Currency:', currency.symbol);
  console.log('\n=== Contract Addresses ===');
  console.log('Treasury:', allAddresses.treasury);
  console.log('Registry:', allAddresses.registry);
  console.log('SessionKeyManager:', allAddresses.sessionKeyManager);
  
  return {
    config,
    addresses: allAddresses,
    chainName,
    rpcUrl,
    currency
  };
}

// ============================================================================
// EXAMPLE 9: Error Handling
// ============================================================================

function Example9_ErrorHandling() {
  try {
    // Trying to get invalid contract name
    const address = getContractAddress(240, 'invalidContract');
  } catch (error) {
    console.error('Error:', error.message);
    // Error: Invalid contract name: invalidContract. Must be one of: treasury, registry, sessionKeyManager
  }
  
  // Safe way to check before using
  const chainId = 999999; // Unknown chain
  const config = getContracts(chainId);
  // This will log a warning and return default chain config (240)
  
  console.log('Fallback config:', config.name); // "Cronos zkEVM Testnet"
}

// ============================================================================
// EXAMPLE 10: Multi-Chain Support
// ============================================================================

function Example10_MultiChain() {
  console.log('=== All Supported Chains ===');
  
  SUPPORTED_CHAIN_IDS.forEach(chainId => {
    const config = getContracts(chainId);
    const deployed = areContractsDeployed(chainId);
    
    console.log(`\n${config.name} (Chain ID: ${chainId})`);
    console.log(`  Deployed: ${deployed ? '✅' : '❌'}`);
    console.log(`  Currency: ${config.nativeCurrency.symbol}`);
    
    if (deployed) {
      console.log(`  Treasury: ${config.treasury}`);
      console.log(`  Registry: ${config.registry}`);
    }
  });
}

// ============================================================================
// COMPLETE REACT COMPONENT EXAMPLE
// ============================================================================

import React from 'react';

function CompleteExample() {
  const { address, chainId } = useAccount();
  
  // Get current chain config
  const config = getCurrentChainConfig(chainId || DEFAULT_CHAIN_ID);
  const isSupported = isChainSupported(chainId);
  const hasContracts = areContractsDeployed(chainId);
  
  // Get all addresses
  const { treasury, registry, sessionKeyManager } = getAllContractAddresses(
    chainId || DEFAULT_CHAIN_ID
  );
  
  if (!isSupported) {
    return (
      <div className="alert alert-warning">
        Chain {chainId} is not supported. Please switch to Cronos zkEVM Testnet.
      </div>
    );
  }
  
  if (!hasContracts) {
    return (
      <div className="alert alert-info">
        Contracts are not yet deployed on {config.name}.
        Using Cronos zkEVM Testnet as fallback.
      </div>
    );
  }
  
  return (
    <div className="contract-info">
      <h2>{config.name}</h2>
      <div className="contracts">
        <div className="contract">
          <h3>Treasury</h3>
          <code>{treasury}</code>
          <a 
            href={getExplorerUrl(chainId, treasury, 'address')} 
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
        
        <div className="contract">
          <h3>Registry</h3>
          <code>{registry}</code>
          <a 
            href={getExplorerUrl(chainId, registry, 'address')} 
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
        
        <div className="contract">
          <h3>Session Key Manager</h3>
          <code>{sessionKeyManager}</code>
          <a 
            href={getExplorerUrl(chainId, sessionKeyManager, 'address')} 
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      </div>
    </div>
  );
}

export default CompleteExample;
