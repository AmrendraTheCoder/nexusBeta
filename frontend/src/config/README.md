# Contract Configuration

## Overview

This directory contains the centralized configuration for all Nexus smart contract addresses and network settings. The `contracts.js` file serves as the **single source of truth** for contract addresses across all supported chains.

## Files

- **`contracts.js`** - Main configuration file with all contract addresses and helper functions
- **`contracts.examples.js`** - Comprehensive usage examples for all scenarios

## Quick Start

### Basic Import

```javascript
import { CRONOS_CONTRACTS } from './config/contracts.js';

console.log(CRONOS_CONTRACTS.treasury);     // 0x86c83A39...
console.log(CRONOS_CONTRACTS.registry);     // 0xe821fAbc...
console.log(CRONOS_CONTRACTS.sessionKeyManager); // 0x59BD809F...
```

### Get Contracts by Chain ID

```javascript
import { getContracts } from './config/contracts.js';

const contracts = getContracts(240); // Cronos zkEVM
console.log(contracts.treasury);
console.log(contracts.rpc);
console.log(contracts.explorer);
```

### Get Specific Contract Address

```javascript
import { getContractAddress } from './config/contracts.js';

const treasuryAddr = getContractAddress(240, 'treasury');
const registryAddr = getContractAddress(240, 'registry');
const skmAddr = getContractAddress(240, 'sessionKeyManager');
```

## Supported Chains

| Chain ID | Network | Status | Contracts Deployed |
|----------|---------|--------|-------------------|
| **240** | Cronos zkEVM Testnet | ✅ Active | ✅ Yes |
| **84532** | Base Sepolia | 🟡 Planned | ❌ No |
| **80002** | Polygon Amoy | 🟡 Planned | ❌ No |
| **11155111** | Ethereum Sepolia | 🟡 Planned | ❌ No |

## Available Helper Functions

### Chain Information

- **`getContracts(chainId)`** - Get all config for a chain
- **`getCurrentChainConfig(chainId)`** - Alias for getContracts
- **`getChainName(chainId)`** - Get human-readable chain name
- **`getRpcUrl(chainId)`** - Get RPC endpoint URL
- **`getNativeCurrency(chainId)`** - Get native currency info

### Contract Addresses

- **`getContractAddress(chainId, contractName)`** - Get specific contract address
- **`getAllContractAddresses(chainId)`** - Get all contract addresses as object

### Validation

- **`isChainSupported(chainId)`** - Check if chain is configured
- **`areContractsDeployed(chainId)`** - Check if contracts are deployed

### Utilities

- **`getExplorerUrl(chainId, address, type)`** - Generate block explorer URL

### Constants

- **`CONTRACTS`** - Object with all chain configurations
- **`CRONOS_CONTRACTS`** - Quick access to Cronos zkEVM contracts
- **`DEFAULT_CHAIN_ID`** - Default chain ID (240)
- **`SUPPORTED_CHAIN_IDS`** - Array of all supported chain IDs

## Usage with Wagmi

```javascript
import { useAccount, useReadContract } from 'wagmi';
import { getContractAddress } from './config/contracts.js';
import { nexusTreasuryAbi } from '../abis/NexusTreasury.js';

function MyComponent() {
  const { chainId } = useAccount();
  
  const treasuryAddress = getContractAddress(chainId || 240, 'treasury');
  
  const { data: minDeposit } = useReadContract({
    address: treasuryAddress,
    abi: nexusTreasuryAbi,
    functionName: 'MIN_DEPOSIT',
  });
  
  return <div>Min Deposit: {minDeposit?.toString()}</div>;
}
```

## Usage with ethers.js

```javascript
import { ethers } from 'ethers';
import { getRpcUrl, getContractAddress } from './config/contracts.js';
import { nexusRegistryAbi } from '../abis/NexusRegistry.js';

async function queryRegistry() {
  const rpcUrl = getRpcUrl(240);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const registryAddress = getContractAddress(240, 'registry');
  const registry = new ethers.Contract(registryAddress, nexusRegistryAbi, provider);
  
  const providers = await registry.getActiveProviders();
  return providers;
}
```

## Type Safety with JSDoc

All functions include comprehensive JSDoc comments for IDE autocomplete:

```javascript
/**
 * @param {number} chainId - The chain ID
 * @param {'treasury' | 'registry' | 'sessionKeyManager'} contractName
 * @returns {string} Contract address
 */
export function getContractAddress(chainId, contractName) {
  // ...
}
```

## Deployed Contracts (Cronos zkEVM Testnet)

### NexusTreasury
- **Address:** `0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7`
- **Explorer:** https://explorer.zkevm.cronos.org/testnet/address/0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7
- **Purpose:** Manages user deposits for the Nexus payment system

### NexusRegistry
- **Address:** `0xe821fAbc3d23790596669043b583e931d8fC2710`
- **Explorer:** https://explorer.zkevm.cronos.org/testnet/address/0xe821fAbc3d23790596669043b583e931d8fC2710
- **Purpose:** On-chain registry for data providers and services

### SessionKeyManager
- **Address:** `0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2`
- **Explorer:** https://explorer.zkevm.cronos.org/testnet/address/0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2
- **Purpose:** Manages session keys for automated workflow execution

## Error Handling

The configuration includes automatic fallback to the default chain (Cronos zkEVM):

```javascript
import { getContracts } from './config/contracts.js';

// If chain 999999 doesn't exist, it falls back to chain 240
const config = getContracts(999999);
console.log(config.name); // "Cronos zkEVM Testnet"
```

Invalid contract names throw descriptive errors:

```javascript
try {
  getContractAddress(240, 'invalidContract');
} catch (error) {
  console.error(error.message);
  // "Invalid contract name: invalidContract. Must be one of: treasury, registry, sessionKeyManager"
}
```

## Best Practices

1. **Always use helper functions** instead of accessing CONTRACTS directly
2. **Check chain support** before using contracts on a new chain
3. **Validate deployment status** with `areContractsDeployed()` before operations
4. **Use constants** like `CRONOS_CONTRACTS` for frequently accessed configs
5. **Handle fallbacks** gracefully when chains aren't supported

## Adding New Chains

To add support for a new chain:

1. Add new entry to `CONTRACTS` object with chain ID as key
2. Include all required fields: name, treasury, registry, sessionKeyManager, rpc, explorer, nativeCurrency
3. Use zero address (`0x0000...`) for contracts not yet deployed
4. Update this README with the new chain

## Testing

Verify the configuration:

```bash
cd contracts
node test-config.js
```

Expected output:
```
✅ ALL CHECKS PASSED!
Contract configuration is correctly set up
```

## Related Files

- **Contract ABIs:** `frontend/src/abis/`
- **Deployment Addresses:** `contracts/deployed-addresses.json`
- **Integration Tests:** `contracts/test-integration.js`

## Support

For issues or questions about the contract configuration:
1. Check `contracts.examples.js` for usage examples
2. Review JSDoc comments in `contracts.js`
3. Run `test-config.js` to verify setup

---

**Last Updated:** December 19, 2025  
**Deployed Contracts:** Cronos zkEVM Testnet  
**Status:** Production Ready ✅
