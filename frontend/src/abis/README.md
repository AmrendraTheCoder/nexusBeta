# Contract ABIs - Usage Guide

## ✅ Successfully Extracted ABIs

All three Nexus smart contract ABIs have been extracted from the Hardhat artifacts and are ready to use in the frontend!

### 📁 Files Created

- `frontend/src/abis/NexusTreasury.js` (342 lines, 27 ABI items, 12 functions)
- `frontend/src/abis/NexusRegistry.js` (532 lines, 31 ABI items, 16 functions)
- `frontend/src/abis/SessionKeyManager.js` (444 lines, 25 ABI items, 10 functions)

### 📊 Verification Results

✅ All files syntactically correct  
✅ Proper ES6 module format  
✅ camelCase naming convention used  
✅ All function signatures present  
✅ Importable in React components  

---

## 🚀 Quick Start

### Import in React Components

```javascript
import { nexusTreasuryAbi } from './abis/NexusTreasury.js';
import { nexusRegistryAbi } from './abis/NexusRegistry.js';
import { sessionKeyManagerAbi } from './abis/SessionKeyManager.js';
```

### Use with Wagmi Hooks

```javascript
import { useReadContract, useWriteContract } from 'wagmi';
import { nexusTreasuryAbi } from './abis/NexusTreasury.js';
import { DEPLOYED_CONTRACTS } from './constants/deployedContracts';

// Read contract data
const { data: minDeposit } = useReadContract({
  address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury,
  abi: nexusTreasuryAbi,
  functionName: 'MIN_DEPOSIT',
});

// Write to contract
const { writeContract } = useWriteContract();

writeContract({
  address: DEPLOYED_CONTRACTS.cronosZkEvmTestnet.treasury,
  abi: nexusTreasuryAbi,
  functionName: 'deposit',
  value: parseEther('0.1'),
});
```

---

## 📦 NexusTreasury Functions (12)

| Function | Type | Description |
|----------|------|-------------|
| `MIN_DEPOSIT()` | view | Get minimum deposit (0.01 CRO) |
| `deposit()` | payable | Deposit CRO into treasury |
| `deposits(address)` | view | Get user's deposit balance |
| `depositsPaused()` | view | Check if deposits paused |
| `emergencyWithdrawAll()` | nonpayable | Owner: emergency withdraw |
| `getBalance(address)` | view | Get user's balance |
| `owner()` | view | Get contract owner |
| `renounceOwnership()` | nonpayable | Renounce ownership |
| `setDepositsPaused(bool)` | nonpayable | Pause/unpause deposits |
| `totalDeposits()` | view | Get total deposits |
| `transferOwnership(address)` | nonpayable | Transfer ownership |
| `withdraw(uint256)` | nonpayable | Withdraw funds |

---

## 📋 NexusRegistry Functions (16)

| Function | Type | Description |
|----------|------|-------------|
| `MIN_PRICE()` | view | Minimum service price |
| `getActiveProviders()` | view | Get all active providers |
| `getProviderCount()` | view | Total provider count |
| `getServiceDetails(address)` | view | Get provider details |
| `getServicesByCategory(string)` | view | Query by category |
| `isProvider(address)` | view | Check if provider |
| `owner()` | view | Get contract owner |
| `paymentExecutor()` | view | Payment executor address |
| `providerList(uint256)` | view | Get provider by index |
| `recordPayment(address,address,uint256)` | nonpayable | Record payment |
| `registerService(string,uint256,string)` | nonpayable | Register service |
| `renounceOwnership()` | nonpayable | Renounce ownership |
| `services(address)` | view | Get service details |
| `setPaymentExecutor(address)` | nonpayable | Set executor |
| `transferOwnership(address)` | nonpayable | Transfer ownership |
| `updateService(string,uint256,string)` | nonpayable | Update service |

---

## 🔑 SessionKeyManager Functions (10)

| Function | Type | Description |
|----------|------|-------------|
| `createSessionKey(...)` | nonpayable | Create new session key |
| `executeWithSessionKey(...)` | payable | Execute tx with key |
| `getRemainingValue(address)` | view | Get remaining spend limit |
| `getSessionKeyDetails(address)` | view | Get key full details |
| `getSessionKeys(address)` | view | Get user's keys |
| `isSessionKeyValid(address)` | view | Check if valid |
| `nonces(address)` | view | Get nonce for replay protection |
| `ownerSessionKeys(address,uint256)` | view | Get key by index |
| `revokeSessionKey(address)` | nonpayable | Revoke a key |
| `sessionKeys(address)` | view | Get key details |

---

## 💡 Usage Examples

See `README-USAGE.js` for complete React component examples including:
- Reading contract state with `useReadContract`
- Writing to contracts with `useWriteContract`
- Using with ethers.js
- Session key management
- Error handling

---

## ✅ Next Steps

1. Import ABIs in your components
2. Use with contract addresses from `constants/deployedContracts.js`
3. Build deposit UI (Prompt 4)
4. Integrate session keys (Prompt 5)
5. Connect to workflows

All ABIs are production-ready! 🎉
