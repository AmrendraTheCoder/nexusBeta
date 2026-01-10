# Phase 2 Quick Reference Guide

## 🚀 Quick Start

### Run Tests
```bash
cd frontend
node test-phase2.cjs
```

### Run Verification
```bash
cd frontend
node verify-phase2.cjs
```

### Start Development
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📱 User Actions

### 1. Deposit CRO
1. Click "Deposit" button (green in header)
2. Enter amount (min 0.01 CRO)
3. Click "Deposit to Treasury"
4. Approve in MetaMask
5. Wait for confetti 🎉

### 2. Create Session Key
1. Click "Features" → "Session Keys"
2. Click "Create New Session Key"
3. Select duration (1h - 7d)
4. Enter max value
5. Toggle permissions
6. Click "Create Session Key"
7. Approve in MetaMask

### 3. Revoke Session Key
1. Open Session Keys panel
2. Click trash icon on active key
3. Confirm revocation
4. Approve in MetaMask

### 4. Create Registry Node
1. Click "Service Registry" in Sidebar
2. Node auto-fills with registry address
3. chainId auto-set to connected chain

## 🔧 Developer Reference

### Contract Addresses (Cronos zkEVM Testnet - Chain 240)
```javascript
Treasury:        0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7
Registry:        0xe821fAbc3d23790596669043b583e931d8fC2710
SessionKeyMgr:   0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2
```

### Import Patterns
```javascript
// Contract config
import { getContracts, getExplorerUrl } from '../config/contracts';

// ABIs
import { nexusTreasuryAbi } from '../abis/NexusTreasury';
import { sessionKeyManagerAbi } from '../abis/SessionKeyManager';
import { nexusRegistryAbi } from '../abis/NexusRegistry';

// Node config
import { NODE_CONFIG, getNodeConfigForChain } from '../config/nodeConfig';
```

### Wagmi Hook Usage
```javascript
// Get contract for current chain
const chainId = chain?.id || 240;
const contracts = getContracts(chainId);

// Read from contract
const { data } = useReadContract({
  address: contracts.treasury,
  abi: nexusTreasuryAbi,
  functionName: 'getBalance',
  args: [address],
  chainId: chainId,
});

// Write to contract
const { writeContract } = useWriteContract();
writeContract({
  address: contracts.treasury,
  abi: nexusTreasuryAbi,
  functionName: 'deposit',
  value: parseEther('0.1'),
});
```

### Backend API
```javascript
// Get virtual balance
GET /api/nexus/balance?wallet=0x...&chainId=240

// Record deposit
POST /api/nexus/deposit
{
  "wallet": "0x...",
  "chainId": 240,
  "amount": "100000000000000000",
  "txHash": "0x..."
}
```

## 📊 Testing

### Test Coverage
- ✅ 14 tests: Deposit Panel
- ✅ 12 tests: Session Key Manager
- ✅ 9 tests: Node Configuration
- ✅ 8 tests: ABI Files
- ✅ 3 tests: Contract Config
- **Total: 46/46 (100%)**

### Test Categories
1. Component existence
2. Import verification
3. Contract integration
4. API integration
5. Error handling
6. UX features

## 🐛 Troubleshooting

### Deposit not working
- ✅ Check wallet has CRO for gas + deposit
- ✅ Verify connected to Cronos zkEVM (240)
- ✅ Check backend is running (localhost:3001)
- ✅ Verify amount >= 0.01 CRO

### Session keys not loading
- ✅ Verify wallet connected
- ✅ Check contract address in console
- ✅ Ensure you've created keys before
- ✅ Click refresh button in panel

### Node not auto-configured
- ✅ Check wallet is connected
- ✅ Verify on supported chain (240, 84532, 80002, 11155111)
- ✅ Check console for logs
- ✅ Try manually entering address

## 📁 File Locations

### Components
- `frontend/src/components/DepositPanel.jsx` - Deposit UI
- `frontend/src/components/SessionKeyPanel.jsx` - Session keys UI

### Configuration
- `frontend/src/config/contracts.js` - Contract addresses
- `frontend/src/config/nodeConfig.js` - Node defaults

### ABIs
- `frontend/src/abis/NexusTreasury.js`
- `frontend/src/abis/NexusRegistry.js`
- `frontend/src/abis/SessionKeyManager.js`

### Tests
- `frontend/test-phase2.cjs` - Test suite
- `frontend/verify-phase2.cjs` - Verification report

### Documentation
- `frontend/PHASE2-COMPLETE.md` - Full documentation
- `frontend/QUICK-REFERENCE.md` - This file

## 🎯 Success Indicators

### Visual Confirmation
- ✅ Green "Deposit" button visible in header
- ✅ "Session Keys" option in Features dropdown
- ✅ Confetti on successful transactions
- ✅ Balance updates after deposit

### Console Logs
```
[App] Created registryQuery node for chain 240
[DepositPanel] Deposit confirmed, notifying backend
[SessionKeyPanel] Creating session key: { address, duration, ... }
```

### Contract Verification
- ✅ View transactions on explorer
- ✅ Check balance on-chain matches UI
- ✅ Session keys visible in contract state

## 🔗 Links

- **Explorer:** https://explorer.zkevm.cronos.org/testnet
- **RPC:** https://testnet.zkevm.cronos.org
- **Faucet:** (get testnet CRO from Cronos Discord)

## ✅ Completion Checklist

Before moving to Phase 3:
- [ ] Run test suite (46/46 passing)
- [ ] Verify deposit flow manually
- [ ] Create and revoke session key
- [ ] Check node auto-configuration
- [ ] Review PHASE2-COMPLETE.md
- [ ] Ensure backend is ready for event listeners

---

**Phase 2 Complete! Ready for Phase 3: Backend-Contract Synchronization**
