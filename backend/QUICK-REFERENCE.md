# 📚 Phase 3 Quick Reference Guide

**Last Updated:** December 19, 2025  
**Status:** ✅ 100% Complete (56/56 Tests Passing)

---

## 🚀 Quick Start

### Run Tests
```bash
cd backend
node test-phase3.cjs
```

### Start Backend with Listener
```bash
# Set environment variable
export ENABLE_DEPOSIT_LISTENER=true
export ENABLE_REGISTRY_UPDATES=true

# Start server
node server.js
```

### Check Listener Status
```bash
curl http://localhost:3001/api/registry/status
```

---

## 🔑 Environment Variables

```bash
# Required
MASTER_WALLET_PRIVATE_KEY=0x...

# Phase 3 Features (Optional - defaults shown)
ENABLE_DEPOSIT_LISTENER=true
ENABLE_REGISTRY_UPDATES=true
SYNC_FROM_BLOCK=                    # Leave empty for new events only
CRONOS_RPC_URL=https://testnet.zkevm.cronos.org
```

---

## 📡 API Endpoints

### Deposit & Balance
```bash
# Get balance
GET /api/nexus/balance/:wallet?chainId=240

# Record deposit (called by listener automatically)
POST /api/nexus/deposit
{
  "wallet": "0x...",
  "chainId": 240,
  "amount": "100000000000000000",
  "txHash": "0x..."
}
```

### Payments
```bash
# Execute payment (includes registry update)
POST /api/nexus/pay
{
  "wallet": "0x...",
  "provider": "0x...",
  "amount": "100000000000000000",
  "chainId": 240
}

# Response includes:
{
  "txHash": "0x...",
  "registryTxHash": "0x..."
}
```

### Provider Registry
```bash
# Register service
POST /api/registry/register-service
{
  "providerWallet": "0x...",
  "endpoint": "https://api.example.com",
  "priceInWei": "100000000000000000",
  "category": "news",
  "chainId": 240
}

# List all providers
GET /api/registry/providers?chainId=240

# Filter by category
GET /api/registry/providers/news?chainId=240

# Get provider details
GET /api/registry/provider/0x...?chainId=240

# System status
GET /api/registry/status
```

---

## 💾 MongoDB Collections

### nexus_deposits
```javascript
{
  wallet: "0x...",
  chainId: 240,
  amount: "50000000000000000",
  txHash: "0x...",
  blockNumber: 12345678,
  processedAt: ISODate("2025-12-19T..."),
  processedBy: "deposit_listener"
}
```

### nexus_balances
```javascript
{
  wallet: "0x...",
  chainId: 240,
  virtualBalance: "500000000000000000",
  createdAt: ISODate("2025-12-19T..."),
  updatedAt: ISODate("2025-12-19T...")
}
```

### nexus_transactions
```javascript
{
  wallet: "0x...",
  type: "payment",
  chainId: 240,
  amount: "100000000000000000",
  provider: "0x...",
  txHash: "0x...",
  registryTxHash: "0x...",  // NEW in Phase 3
  timestamp: ISODate("2025-12-19T..."),
  status: "completed"
}
```

### registered_providers
```javascript
{
  providerWallet: "0x...",
  endpoint: "https://api.example.com",
  priceInWei: "100000000000000000",
  category: "news",
  chainId: 240,
  registeredAt: ISODate("2025-12-19T..."),
  status: "active",
  active: true
}
```

---

## 🏗️ Contract Addresses (Cronos zkEVM Testnet)

```javascript
const CONTRACTS = {
  treasury: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
  registry: "0xe821fAbc3d23790596669043b583e931d8fC2710",
  sessionKeyManager: "0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2"
};
```

**Block Explorer:** https://explorer.zkevm.cronos.org/testnet

---

## 🧪 Testing Checklist

### Automated Tests
```bash
cd backend
node test-phase3.cjs

# Should show:
# ✅ Passed: 56
# ❌ Failed: 0
# 📈 Success Rate: 100.0%
```

### Manual Tests

#### 1. Deposit Detection
```bash
# 1. Start backend with listener enabled
ENABLE_DEPOSIT_LISTENER=true node server.js

# 2. Make deposit from frontend (DepositPanel)

# 3. Check logs for:
[DEPOSIT-LISTENER] Processing deposit:
  User: 0x...
  Amount: 0.05 CRO
  Tx: 0x...
[DEPOSIT-LISTENER] ✅ Deposit processed successfully

# 4. Verify MongoDB
db.nexus_deposits.find({ wallet: "0x..." })
db.nexus_balances.find({ wallet: "0x...", chainId: 240 })
```

#### 2. Registry Payment
```bash
# 1. Execute payment
curl -X POST http://localhost:3001/api/nexus/pay \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x...",
    "provider": "0x...",
    "amount": "100000000000000000",
    "chainId": 240
  }'

# 2. Check response has both txHash and registryTxHash

# 3. Verify on blockchain
# - Payment tx: https://explorer.zkevm.cronos.org/testnet/tx/0x...
# - Registry tx: https://explorer.zkevm.cronos.org/testnet/tx/0x...

# 4. Check provider reputation increased
curl http://localhost:3001/api/registry/provider/0x...?chainId=240
```

#### 3. Provider Registration
```bash
# 1. Register service
curl -X POST http://localhost:3001/api/registry/register-service \
  -H "Content-Type: application/json" \
  -d '{
    "providerWallet": "0x...",
    "endpoint": "https://api.example.com",
    "priceInWei": "100000000000000000",
    "category": "news",
    "chainId": 240
  }'

# 2. Submit transaction using returned txData

# 3. Query providers
curl http://localhost:3001/api/registry/providers?chainId=240

# 4. Check provider appears in list
```

---

## 🔧 Troubleshooting

### Listener Not Starting
```bash
# Check environment variable
echo $ENABLE_DEPOSIT_LISTENER  # Should be "true"

# Check RPC connection
curl https://testnet.zkevm.cronos.org

# Check logs
# Should see: [DEPOSIT-LISTENER] ✅ Listener started successfully
```

### Registry Updates Failing
```bash
# Check if registry deployed
curl http://localhost:3001/api/registry/status

# Check master wallet has CRO
# Check ENABLE_REGISTRY_UPDATES=true

# Check logs for:
[NEXUS] Registry updated: 0x...
```

### Deposits Not Auto-Credited
```bash
# Check listener is running
curl http://localhost:3001/api/registry/status

# Check MongoDB connection
# Check nexus_deposits collection for duplicates

# Check last processed block
db.listener_metadata.find({ listenerId: "deposit_listener" })
```

---

## 📁 File Locations

```
backend/
├── depositListener.js          # Deposit event listener (596 lines)
├── server.js                   # Enhanced backend (1259 lines)
├── test-phase3.cjs             # Test suite (625 lines)
├── verify-phase3.cjs           # Verification report
├── PHASE3-COMPLETE.md          # Full documentation
├── QUICK-REFERENCE.md          # This file
├── .env.example                # Environment template
└── abis/
    ├── nexusRegistryAbi.js     # Registry ABI
    └── nexusTreasuryAbi.js     # Treasury ABI
```

---

## ✅ Success Indicators

### Deposit Listener
- ✅ Logs show "Listener started successfully"
- ✅ Deposits appear in MongoDB within seconds
- ✅ Virtual balance auto-updates
- ✅ No duplicate processing

### Registry Integration
- ✅ Payments return both txHash and registryTxHash
- ✅ Provider reputation increases
- ✅ On-chain events emitted
- ✅ Non-blocking errors logged

### Provider Endpoints
- ✅ Registration validation works
- ✅ Providers queryable on-chain
- ✅ Category filtering functional
- ✅ Caching reduces RPC calls

---

## 📊 Performance Metrics

### Expected Performance
- Deposit detection: **< 15 seconds** (Cronos block time)
- Payment execution: **< 30 seconds** (dual transactions)
- Provider query: **< 1 second** (with cache)
- Cache TTL: **5 minutes**
- Reconnection: **Max 10 attempts, 5s delay**

---

## 🚀 Next Phase

**Phase 4: Engine-Signer Integration (PROMPT 10, 11)**

Will implement:
- D8N Engine → Signer Service connection
- Real on-chain transaction execution from workflows
- Session key-based autonomous execution
- Transaction status tracking in engine

---

## 📚 Additional Resources

- **Full Documentation:** `PHASE3-COMPLETE.md`
- **Verification Report:** Run `node verify-phase3.cjs`
- **Test Suite:** Run `node test-phase3.cjs`
- **Contract Explorer:** https://explorer.zkevm.cronos.org/testnet

---

**Questions? Check PHASE3-COMPLETE.md for detailed explanations.**
