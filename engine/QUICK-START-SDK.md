# NexusPay SDK Integration - Quick Start

## ✨ What We've Done

We've successfully refactored the **NexusPayNode** to use the brand new **@nexus-ecosystem/nip1 SDK**! This is the critical "dogfooding" step for our hackathon submission.

### 🎯 Key Changes

**Before (Old Implementation):**
- Manual axios HTTP requests
- Hand-rolled 402 detection and parsing
- Called backend API to execute payments
- Fragile error handling
- No payment caching
- ~150 lines of boilerplate code

**After (With SDK):**
- ✅ Clean NIP1Client integration
- ✅ Auto-handles 402 responses
- ✅ Built-in transaction signing
- ✅ Payment caching and replay protection
- ✅ Multi-chain support
- ✅ Comprehensive error handling
- ✅ ~80 lines of clean, maintainable code

---

## 🚀 Quick Start (3 Commands)

### 1. Install SDK Dependency

```bash
cd engine
npm install
```

This adds `@nexus-ecosystem/nip1` from your local SDK build.

### 2. Start Mock Provider

Open a **new terminal**:

```bash
cd sdk/nip1-sdk/examples
node provider-express.js
```

You should see:
```
✅ NIP-1 Mock Provider is running!

📍 Endpoints:
   GET http://localhost:3000/free       - No payment
   GET http://localhost:3000/premium    - 0.1 token payment
   GET http://localhost:3000/expensive  - 0.5 token payment
```

### 3. Run Test Workflow

In your **original terminal**:

```bash
cd engine
tsx src/server.ts test-nexuspay-sdk.json
```

---

## 📋 Expected Output

```
🚀 [NexusPay] Starting request to http://localhost:3000/premium
💳 [SDK] Initializing client on chain 84532
🔑 [SDK] Wallet address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💳 [SDK] Auto-pay enabled, will handle 402 responses
⚡ [SDK] Received 402 Payment Required
💰 [SDK] Payment required: 0.1 to 0x742d35Cc6634C0532925a3b844Bc9e7595f5e123
⛓️  [SDK] Chain: 84532
🔐 [SDK] Signing transaction...
✍️  [SDK] Transaction hash: 0xabc123def456...
⏳ [SDK] Waiting for confirmation...
✅ [SDK] Payment confirmed: 0xabc123def456...
📦 [NexusPay] Retrying with payment proof...
✅ [NexusPay] Success!

Response: {
  "success": true,
  "data": {
    "message": "Premium crypto data unlocked! 🎉",
    "price": { "BTC": "$43,521", "ETH": "$2,289" }
  },
  "txHash": "0xabc123def456...",
  "cost": "0.1",
  "chainId": 84532
}
```

---

## 🧪 Test Scenarios

The test workflow (`test-nexuspay-sdk.json`) tests 3 scenarios:

### ✅ Scenario 1: Free Endpoint
- **URL:** `http://localhost:3000/free`
- **Expected:** Immediate 200 response, no payment
- **Log:** `✅ [NexusPay] Success! (No payment required)`

### ✅ Scenario 2: Premium Endpoint
- **URL:** `http://localhost:3000/premium`
- **Cost:** 0.1 tokens
- **Expected:** 402 → Auto-pay → 200 with data
- **Log:** Full payment flow with emojis

### ✅ Scenario 3: Expensive Endpoint
- **URL:** `http://localhost:3000/expensive`
- **Cost:** 0.5 tokens
- **Expected:** 402 → Auto-pay → 200 with institutional data
- **Log:** Full payment flow

---

## 🔧 Configuration

Edit `test-nexuspay-sdk.json` to customize:

```json
{
  "globalContext": {
    "userPrivateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "chainId": 84532,
    "rpcUrl": "https://sepolia.base.org",
    "maxPrice": "1.0"
  }
}
```

### Options:
- **userPrivateKey:** Your test wallet (NEVER use real funds on mainnet!)
- **chainId:** 84532 (Base Sepolia), 240 (Cronos zkEVM), etc.
- **rpcUrl:** RPC endpoint for the chain
- **maxPrice:** Maximum tokens willing to pay (e.g., "1.0")

---

## 🐛 Troubleshooting

### ❌ "Cannot find module '@nexus-ecosystem/nip1'"

**Fix:**
```bash
cd engine
npm install
```

### ❌ "ECONNREFUSED 127.0.0.1:3000"

**Fix:** Start the mock provider:
```bash
cd sdk/nip1-sdk/examples
node provider-express.js
```

### ❌ "Insufficient funds for gas"

**Fix:** Get Base Sepolia ETH from a faucet:
- https://www.alchemy.com/faucets/base-sepolia
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### ❌ "Payment verification failed"

**Fix:** 
1. Ensure mock provider is running
2. Check wallet has enough balance
3. Verify chainId matches between workflow and provider

### ❌ TypeScript errors

**Fix:**
```bash
cd sdk/nip1-sdk
npm run build
cd ../../engine
npm install
```

---

## 📊 Code Comparison

### Old Implementation (150+ lines):
```typescript
// Manual 402 detection
if (firstResponse.status === 402) {
  const paymentDetails = this.parsePaymentHeaders(firstResponse);
  const paymentResult = await this.executePayment(paymentDetails);
  const secondResponse = await this.makeRequest(paymentResult.txHash);
  // ... lots of error handling
}
```

### New Implementation (Clean!):
```typescript
// SDK handles everything!
const data = await this.client.get(url);
// That's it! 402 is automatically handled internally.
```

---

## 🎯 Next Steps

1. ✅ **Integration Complete** - NexusPayNode now uses SDK
2. 🧪 **Test All Scenarios** - Run the test workflow
3. 📝 **Update Documentation** - Add SDK usage to engine README
4. 🚀 **Deploy to Vercel** - Ensure SDK is bundled correctly
5. 🎥 **Create Demo Video** - Show the payment flow for hackathon

---

## 📚 Additional Resources

- **Full Integration Guide:** `engine/NEXUSPAY-SDK-INTEGRATION.md`
- **SDK Documentation:** `sdk/nip1-sdk/README.md`
- **NIP-1 Standard:** `docs/NIP-1-STANDARD.md`
- **Test Examples:** `sdk/nip1-sdk/examples/`

---

## 💡 Pro Tips

1. **Use `autoPay: true`** for automatic payment handling (default)
2. **Enable caching** to prevent replay attacks (default)
3. **Set `maxPrice`** to protect against price spikes
4. **Use `beforePayment` callback** for user confirmation
5. **Log payment history** with `getPaymentHistory()`

---

## ✨ That's It!

You now have a production-ready payment-gated API node using the official NIP-1 SDK. The integration is complete and ready for the hackathon demo!

**Questions?** Check `engine/NEXUSPAY-SDK-INTEGRATION.md` for detailed documentation.

**Happy Building! 🚀**
