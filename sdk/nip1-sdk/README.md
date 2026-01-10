# @nexus-ecosystem/nip1

Official SDK for implementing and consuming **NIP-1 (Nexus Interface Protocol)** payment-gated APIs.

[![npm version](https://img.shields.io/npm/v/@nexus-ecosystem/nip1.svg)](https://www.npmjs.com/package/@nexus-ecosystem/nip1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- ✅ **Provider SDK**: Add HTTP 402 paywall to any Express API
- ✅ **Client SDK**: Automatically handle payments when consuming APIs
- ✅ **Multi-chain Support**: Works on Cronos, Base, Polygon, Ethereum
- ✅ **Payment Caching**: Avoid duplicate charges
- ✅ **TypeScript**: Full type definitions included
- ✅ **Zero Config**: Works out of the box with sensible defaults

## 📦 Installation

```bash
npm install @nexus-ecosystem/nip1
```

## 🔧 Quick Start

### Provider (API Builder)

```typescript
import express from 'express';
import { requirePayment } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

const app = express();

app.get('/premium-data',
  requirePayment({
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
    price: ethers.parseEther('0.1'), // 0.1 native token
    chainId: 240 // Cronos zkEVM
  }),
  (req, res) => {
    res.json({ data: 'Your premium content' });
  }
);

app.listen(4000);
```

### Client (API Consumer)

```typescript
import { NIP1Client } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

const wallet = new ethers.Wallet('PRIVATE_KEY', provider);

const client = new NIP1Client({
  wallet,
  maxPrice: '1.0', // Max 1 token per request
  autoPay: true
});

// Automatically pays and retries on 402
const data = await client.get('http://api.example.com/premium-data');
console.log(data);
```

## 📖 Documentation

### Provider API

#### `requirePayment(config)`

Express middleware that implements NIP-1 paywall.

**Options:**

```typescript
{
  recipient: string;           // Payment recipient address
  price: bigint | string;      // Price in wei or formatted ("0.1")
  chainId?: number;            // Primary chain ID (default: 240)
  supportedChains?: number[];  // Additional supported chains
  confirmations?: number;      // Required confirmations (default: 1)
  cache?: PaymentCache;        // Custom payment cache
  onError?: (error, req, res) => void;
  onSuccess?: (txHash, req) => void;
}
```

**Example:**

```typescript
app.get('/api/data',
  requirePayment({
    recipient: '0x...',
    price: ethers.parseEther('0.5'),
    chainId: 240,
    supportedChains: [240, 84532, 80002],
    onSuccess: (txHash, req) => {
      console.log('Payment received:', txHash);
    }
  }),
  (req, res) => {
    // Access payment info
    const { txHash, chainId } = req.payment;
    res.json({ data: 'premium content', paid: true });
  }
);
```

#### `verifyPayment(txHash, chainId, amount, recipient)`

Verify a payment transaction on-chain.

```typescript
import { verifyPayment } from '@nexus-ecosystem/nip1';

const result = await verifyPayment(
  '0x1234...', // Transaction hash
  240,         // Chain ID
  ethers.parseEther('0.1'), // Expected amount
  '0x742d35...' // Expected recipient
);

if (result.valid) {
  console.log('Payment verified!', result.transaction);
} else {
  console.log('Invalid payment:', result.error);
}
```

#### `PaymentCache`

Manage payment cache to prevent replay attacks.

```typescript
import { PaymentCache } from '@nexus-ecosystem/nip1';

const cache = new PaymentCache(5 * 60 * 1000); // 5 minutes TTL

if (cache.has(txHash)) {
  return 'Payment already used';
}

cache.add(txHash);
```

### Client API

#### `NIP1Client`

Client for consuming NIP-1 payment-gated APIs.

**Constructor:**

```typescript
const client = new NIP1Client({
  wallet: ethers.Wallet | ethers.Signer,
  maxPrice?: string | bigint,        // Maximum price willing to pay
  autoPay?: boolean,                  // Auto-pay on 402 (default: true)
  enableCache?: boolean,              // Cache payments (default: true)
  beforePayment?: async (details) => boolean,
  afterPayment?: async (txHash, details) => void
});
```

**Methods:**

```typescript
// GET request
const data = await client.get(url, axiosConfig?);

// POST request
const result = await client.post(url, data, axiosConfig?);

// Generic request
const response = await client.request({ method: 'GET', url });

// Clear payment cache
client.clearCache();

// Get cache size
const size = client.getCacheSize();
```

**Example with Callbacks:**

```typescript
const client = new NIP1Client({
  wallet: myWallet,
  maxPrice: '5.0',
  
  beforePayment: async (details) => {
    console.log(`Pay ${details.amountFormatted} to ${details.recipient}?`);
    // Return false to cancel payment
    return true;
  },
  
  afterPayment: async (txHash, details) => {
    console.log(`Payment successful: ${txHash}`);
    // Log to database, update UI, etc.
  }
});
```

#### `autoPayFetch(url, config)`

Simplified auto-payment wrapper for single requests.

```typescript
import { autoPayFetch } from '@nexus-ecosystem/nip1';

const data = await autoPayFetch(
  'http://api.example.com/premium',
  {
    wallet: myWallet,
    maxPrice: '1.0'
  }
);
```

### Utility Functions

#### `parsePaymentRequired(response)`

Parse 402 response to extract payment details.

```typescript
import { parsePaymentRequired } from '@nexus-ecosystem/nip1';

const details = parsePaymentRequired(response);
// Returns: { recipient, amount, amountFormatted, chainId, assetType, ... }
```

#### `createPaymentProof(txHash, chainId)`

Create payment proof header string.

```typescript
import { createPaymentProof } from '@nexus-ecosystem/nip1';

const proof = createPaymentProof(
  '0x1234...abcd',
  240
);
// Returns: "0x1234...abcd:240"
```

#### `parsePaymentProof(header)`

Parse payment proof header.

```typescript
import { parsePaymentProof } from '@nexus-ecosystem/nip1';

const proof = parsePaymentProof('0x1234...abcd:240');
// Returns: { txHash: '0x1234...abcd', chainId: 240 }
```

## 🌐 Supported Chains

| Chain | Chain ID | Testnet |
|-------|----------|---------|
| Cronos zkEVM | 240 | ✅ |
| Base | 84532 | ✅ Sepolia |
| Polygon | 80002 | ✅ Amoy |
| Ethereum | 11155111 | ✅ Sepolia |

## 🎯 Use Cases

### 1. **AI Agent Data Access**

```typescript
const agent = new NIP1Client({
  wallet: agentWallet,
  maxPrice: '10.0',
  autoPay: true
});

// Agent autonomously pays for data
const marketData = await agent.get('https://api.crypto.com/premium/sentiment');
const prediction = await agent.get('https://api.ai.com/price-prediction');

// Make trading decision
executeTrade(marketData, prediction);
```

### 2. **Micro-services Payment**

```typescript
// Service A pays Service B per-request
const serviceClient = new NIP1Client({ wallet: serviceWallet });

const result = await serviceClient.post('https://service-b/process', {
  data: processData
});
```

### 3. **Premium API Monetization**

```typescript
// Monetize your API with one line of code
app.get('/api/premium',
  requirePayment({
    recipient: '0x...',
    price: '0.01' // 0.01 CRO per call
  }),
  premiumHandler
);
```

## 📚 Examples

See [examples/](./examples) directory for complete examples:

- [provider-basic.js](./examples/provider-basic.js) - Basic Express API with payment gating
- [client-basic.js](./examples/client-basic.js) - Consuming payment-gated APIs
- [agent-automation.js](./examples/agent-automation.js) - AI agent with autonomous payments

## 🧪 Testing

```bash
npm test
npm run test:coverage
```

## 📄 Specification

NIP-1 is fully documented at [docs/standards/nip-1.md](../../docs/standards/nip-1.md)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

## 📝 License

MIT License - see [LICENSE](./LICENSE)

## 🔗 Links

- [Documentation](https://docs.nexus-ecosystem.com/nip1)
- [Specification](../../docs/standards/nip-1.md)
- [GitHub](https://github.com/nexus-ecosystem/nip1-sdk)
- [NPM](https://www.npmjs.com/package/@nexus-ecosystem/nip1)

## 💬 Support

- Discord: https://discord.gg/nexus
- Twitter: [@NexusEcosystem](https://twitter.com/NexusEcosystem)
- Email: support@nexus-ecosystem.com

---

**Built with ❤️ by the Nexus Ecosystem Team**
