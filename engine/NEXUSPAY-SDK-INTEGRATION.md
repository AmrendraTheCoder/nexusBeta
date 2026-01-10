# NexusPayNode SDK Integration Guide

## Step 1: Install the NIP-1 SDK into Engine

Run this command from the `engine/` directory:

```bash
npm install ../sdk/nip1-sdk
```

Or if using the published package name:

```bash
npm install --save file:../sdk/nip1-sdk
```

This will add the dependency to your `package.json` as:
```json
"@nexus-ecosystem/nip1": "file:../sdk/nip1-sdk"
```

## Step 2: NexusPayNode.ts Implementation

The complete rewritten node using the SDK is in `engine/src/components/NexusPayNode.ts`.

### Key Changes:
- ✅ Uses `NIP1Client` from SDK instead of manual axios calls
- ✅ Auto-handles 402 Payment Required responses
- ✅ Automatic transaction signing and retry
- ✅ Multi-chain support built-in
- ✅ Payment caching to prevent replay attacks
- ✅ Proper error handling and logging

## Step 3: Testing Plan

### 3.1 Start the Mock Provider API

From the root directory, run:

```bash
cd sdk/nip1-sdk/examples
node provider-basic.js
```

This starts a mock API on `http://localhost:3000` with these endpoints:
- `GET /free` - No payment required
- `GET /premium` - Requires 0.1 token payment
- `GET /expensive` - Requires 0.5 token payment

### 3.2 Prepare Test Environment

1. **Set up environment variables** (`.env` in engine folder):
```env
# Test wallet (DO NOT use real funds on mainnet)
TEST_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL (Base Sepolia testnet)
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Chain ID
CHAIN_ID=84532
```

2. **Ensure wallet has testnet funds** on Base Sepolia

### 3.3 Test Workflow JSON

Create a test file `engine/test-nexuspay-sdk.json`:

```json
{
  "name": "Test NexusPay SDK Integration",
  "nodes": [
    {
      "id": "start",
      "type": "trigger",
      "label": "Start"
    },
    {
      "id": "nexus-pay-1",
      "type": "nexusPay",
      "label": "Fetch Premium Data",
      "config": {
        "url": "http://localhost:3000/premium",
        "method": "GET"
      }
    },
    {
      "id": "output",
      "type": "output",
      "label": "Display Result"
    }
  ],
  "edges": [
    { "from": "start", "to": "nexus-pay-1" },
    { "from": "nexus-pay-1", "to": "output" }
  ],
  "globalContext": {
    "userPrivateKey": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "chainId": 84532,
    "rpcUrl": "https://sepolia.base.org"
  }
}
```

### 3.4 Run the Test

```bash
cd engine
npm run test -- test-nexuspay-sdk.json
```

Or if using tsx directly:
```bash
tsx src/server.ts test-nexuspay-sdk.json
```

### 3.5 Expected Console Output

If the integration works correctly, you should see:

```
🚀 [NexusPay] Starting request to http://localhost:3000/premium
💳 [SDK] Auto-pay enabled, will handle 402 responses
⚡ [SDK] Received 402 Payment Required
💰 [SDK] Payment details: 0.1 tokens to 0x742d35Cc6634C0532925a3b844Bc9e7595f5e123
🔐 [SDK] Signing transaction on chain 84532...
✍️  [SDK] Transaction hash: 0xabc123def456...
⏳ [SDK] Waiting for confirmation...
✅ [SDK] Payment confirmed! Retrying request with proof...
📦 [NexusPay] Data received successfully
✅ [NexusPay] Success!
```

### 3.6 Expected Response Object

```json
{
  "success": true,
  "data": {
    "message": "Premium crypto data unlocked!",
    "price": "BTC: $43,521",
    "timestamp": "2025-12-21T14:52:00Z"
  },
  "txHash": "0xabc123def456...",
  "cost": "0.1",
  "chainId": 84532
}
```

### 3.7 Error Scenarios to Test

#### Test 1: Missing Private Key
Remove `userPrivateKey` from globalContext. Expected:
```
❌ [NexusPay] Validation Error: Missing required field: userPrivateKey
```

#### Test 2: Insufficient Wallet Balance
Use a wallet with no funds. Expected:
```
🚀 [NexusPay] Starting request...
💳 [SDK] Auto-pay enabled...
⚡ [SDK] Received 402...
❌ [SDK] Payment failed: insufficient funds for gas
❌ [NexusPay] Failed: Payment execution failed
```

#### Test 3: Invalid URL
Use `http://localhost:9999/nonexistent`. Expected:
```
🚀 [NexusPay] Starting request to http://localhost:9999/nonexistent
❌ [NexusPay] Network Error: connect ECONNREFUSED 127.0.0.1:9999
```

#### Test 4: Free Endpoint (No Payment)
Change URL to `http://localhost:3000/free`. Expected:
```
🚀 [NexusPay] Starting request to http://localhost:3000/free
✅ [NexusPay] Success! (No payment required)
```

## Troubleshooting

### Issue: "Cannot find module '@nexus-ecosystem/nip1'"
**Solution:** Run `npm install ../sdk/nip1-sdk` from the engine directory.

### Issue: "Payment verification failed"
**Solution:** 
1. Ensure mock provider is running on port 3000
2. Check that the recipient address in the mock provider matches the one in the 402 response
3. Verify RPC URL is correct for the chain ID

### Issue: "Transaction underpriced"
**Solution:** Increase gas price in the SDK client config (this should be rare on testnets).

### Issue: TypeScript errors
**Solution:** 
1. Run `npm run build` in the SDK directory first
2. Ensure `@types/node` is installed in engine
3. Check that `tsconfig.json` includes the SDK types

## Integration Checklist

- [ ] SDK installed in engine/package.json
- [ ] NexusPayNode.ts updated to use NIP1Client
- [ ] Environment variables configured
- [ ] Test wallet has Base Sepolia ETH
- [ ] Mock provider running on port 3000
- [ ] Test workflow JSON created
- [ ] All 4 test scenarios pass
- [ ] Logs show correct emoji sequence
- [ ] Payment transaction appears on Base Sepolia explorer

## Next Steps After Testing

1. **Update Other Nodes:** Consider refactoring other payment-related nodes to use the SDK
2. **Add to CI/CD:** Include SDK integration tests in automated testing
3. **Documentation:** Update engine README with SDK usage examples
4. **Monitoring:** Add metrics for payment success rates
5. **Error Recovery:** Implement retry logic for transient failures

---

**Need Help?** 
- Check SDK docs: `sdk/nip1-sdk/README.md`
- Review examples: `sdk/nip1-sdk/examples/`
- Run SDK tests: `cd sdk/nip1-sdk && npm test`
