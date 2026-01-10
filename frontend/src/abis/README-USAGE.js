/**
 * ABI Import Examples - How to use the extracted ABIs in your React components
 * 
 * All three contract ABIs have been successfully extracted and are ready to use!
 */

// ============================================
// EXAMPLE 1: Basic Import
// ============================================

import { nexusTreasuryAbi } from './abis/NexusTreasury.js';
import { nexusRegistryAbi } from './abis/NexusRegistry.js';
import { sessionKeyManagerAbi } from './abis/SessionKeyManager.js';

// ============================================
// EXAMPLE 2: Using with Wagmi (React Hooks)
// ============================================

import { useReadContract, useWriteContract } from 'wagmi';
import { nexusTreasuryAbi } from './abis/NexusTreasury.js';
import { DEPLOYED_CONTRACTS } from './constants/deployedContracts';

function TreasuryExample() {
  // Read MIN_DEPOSIT constant
  const { data: minDeposit } = useReadContract({
    address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury,
    abi: nexusTreasuryAbi,
    functionName: 'MIN_DEPOSIT',
  });

  // Read user's deposit balance
  const { data: balance } = useReadContract({
    address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury,
    abi: nexusTreasuryAbi,
    functionName: 'getBalance',
    args: ['0xYourAddress'],
  });

  // Write: Make a deposit
  const { writeContract } = useWriteContract();

  const handleDeposit = () => {
    writeContract({
      address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury,
      abi: nexusTreasuryAbi,
      functionName: 'deposit',
      value: parseEther('0.1'), // 0.1 CRO
    });
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}

// ============================================
// EXAMPLE 3: Using with ethers.js
// ============================================

import { ethers } from 'ethers';
import { nexusRegistryAbi } from './abis/NexusRegistry.js';

async function queryRegistry() {
  const provider = new ethers.JsonRpcProvider('https://testnet.zkevm.cronos.org');
  
  const registry = new ethers.Contract(
    DEPLOYED_CONTRACTS.cronosZkEvmTestnet.registry,
    nexusRegistryAbi,
    provider
  );

  // Read active providers
  const providers = await registry.getActiveProviders();
  
  // Get services by category
  const [addresses, prices, reputations] = await registry.getServicesByCategory('news');
  
  return { providers, addresses, prices, reputations };
}

// ============================================
// EXAMPLE 4: Session Key Management
// ============================================

import { sessionKeyManagerAbi } from './abis/SessionKeyManager.js';

function SessionKeyExample() {
  const { writeContract } = useWriteContract();

  const createSessionKey = (keyAddress, duration, maxValue) => {
    const validUntil = Math.floor(Date.now() / 1000) + duration;
    
    writeContract({
      address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.sessionKeyManager,
      abi: sessionKeyManagerAbi,
      functionName: 'createSessionKey',
      args: [
        keyAddress,
        validUntil,
        parseEther(maxValue),
        [] // allowedFunctions
      ],
    });
  };

  // Get user's session keys
  const { data: sessionKeys } = useReadContract({
    address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.sessionKeyManager,
    abi: sessionKeyManagerAbi,
    functionName: 'getSessionKeys',
    args: ['0xYourAddress'],
  });

  return <div>{/* Your UI */}</div>;
}

// ============================================
// AVAILABLE FUNCTIONS BY CONTRACT
// ============================================

/*

📦 NexusTreasury (12 functions)
  - MIN_DEPOSIT() - Get minimum deposit amount
  - deposit() - Deposit CRO into treasury
  - deposits(address) - Get user's deposit balance
  - depositsPaused() - Check if deposits are paused
  - emergencyWithdrawAll() - Owner only: withdraw all
  - getBalance(address) - Get user's balance
  - owner() - Get contract owner
  - renounceOwnership() - Renounce contract ownership
  - setDepositsPaused(bool) - Pause/unpause deposits
  - totalDeposits() - Get total deposits in contract
  - transferOwnership(address) - Transfer ownership
  - withdraw(uint256) - Withdraw from treasury

📋 NexusRegistry (16 functions)
  - MIN_PRICE() - Get minimum service price
  - getActiveProviders() - Get all active providers
  - getProviderCount() - Get total provider count
  - getServiceDetails(address) - Get provider details
  - getServicesByCategory(string) - Query by category
  - isProvider(address) - Check if address is provider
  - owner() - Get contract owner
  - paymentExecutor() - Get payment executor address
  - providerList(uint256) - Get provider by index
  - recordPayment(address,address,uint256) - Record payment
  - registerService(string,uint256,string) - Register service
  - renounceOwnership() - Renounce ownership
  - services(address) - Get service by provider
  - setPaymentExecutor(address) - Set payment executor
  - transferOwnership(address) - Transfer ownership
  - updateService(string,uint256,string) - Update service

🔑 SessionKeyManager (10 functions)
  - createSessionKey(address,uint256,uint256,bytes4[]) - Create key
  - executeWithSessionKey(address,address,uint256,bytes,bytes) - Execute with key
  - getRemainingValue(address) - Get remaining spend limit
  - getSessionKeyDetails(address) - Get key details
  - getSessionKeys(address) - Get user's keys
  - isSessionKeyValid(address) - Check if key is valid
  - nonces(address) - Get user's nonce
  - ownerSessionKeys(address,uint256) - Get key by index
  - revokeSessionKey(address) - Revoke a key
  - sessionKeys(address) - Get key details by address

*/

export {};
