# NIP-1: Nexus Interface Protocol v1.0

**Status:** Draft  
**Author:** Nexus Ecosystem Team  
**Created:** December 21, 2025  
**Updated:** December 21, 2025  

---

## Abstract

NIP-1 (Nexus Interface Protocol) defines a standardized HTTP-based protocol for implementing pay-per-use APIs using blockchain payments. It leverages HTTP status code 402 (Payment Required) to create a seamless payment flow where AI agents and applications can autonomously access premium data and services.

## Motivation

Traditional API monetization relies on API keys, subscriptions, or OAuth tokens, which are difficult for AI agents to manage autonomously. NIP-1 enables:

- **Autonomous Payments**: AI agents can pay for API access without human intervention
- **Micro-transactions**: Pay only for what you use, down to individual API calls
- **Multi-chain Support**: Works across any EVM-compatible blockchain
- **Transparent Pricing**: Pricing information embedded in HTTP headers
- **Trustless Verification**: All payments verifiable on-chain

## Specification

### 1. HTTP 402 Payment Required Response

When an API endpoint requires payment, it MUST return HTTP status code `402` with the following headers and response body:

#### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `X-Cronos-Address` | `address` | Payment recipient wallet address | `0x742d35Cc6634C0532925a3b844Bc9e7595f5e123` |
| `X-Cost` | `uint256` | Payment amount in wei (base units) | `100000000000000000` (0.1 native token) |
| `X-Asset-Type` | `string` | Asset type: `native`, `ERC20`, `ERC721` | `native` |
| `X-Chain-Id` | `uint256` | Primary blockchain chain ID | `240` (Cronos zkEVM) |

#### Optional Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `X-Supported-Chains` | `string` | Comma-separated list of supported chain IDs | `240,84532,80002,11155111` |
| `X-Payment-Format` | `string` | Expected payment proof format | `txHash:chainId` |
| `X-Token-Address` | `address` | ERC20 token address (if asset-type is ERC20) | `0x...` |
| `X-Expiry` | `uint256` | Unix timestamp when price expires | `1735142400` |

#### Response Body Format

```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment of 0.1 CRO",
  "endpoint": "/api/premium/data",
  "payment": {
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
    "amount": "100000000000000000",
    "amountFormatted": "0.1 CRO",
    "assetType": "native",
    "supportedChains": [
      {
        "chainId": 240,
        "name": "Cronos zkEVM Testnet",
        "rpcUrl": "https://testnet.zkevm.cronos.org"
      },
      {
        "chainId": 84532,
        "name": "Base Sepolia",
        "rpcUrl": "https://sepolia.base.org"
      }
    ],
    "instructions": "Send payment to the recipient address, then retry with header: X-PAYMENT: <txHash>:<chainId>"
  }
}
```

### 2. Payment Proof Header

After executing payment, clients MUST retry the request with the payment proof header:

**Format:**
```
X-PAYMENT: <transactionHash>:<chainId>
```

**Examples:**
```
X-PAYMENT: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:240
X-PAYMENT: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890:84532
```

### 3. Payment Verification

Providers MUST verify payment proofs by:

1. **Parsing** the payment header to extract `txHash` and `chainId`
2. **Querying** the blockchain to retrieve transaction details
3. **Validating** that:
   - Transaction exists and is confirmed
   - Transaction recipient matches provider's address
   - Transaction value meets or exceeds required amount
   - Transaction is recent (recommended: within last 10 minutes)
   - Transaction hasn't been used before (prevent replay attacks)

### 4. Success Response

After valid payment verification, the API MUST return the requested data with HTTP status `200 OK`.

### 5. Error Codes

| HTTP Status | Description | Action |
|-------------|-------------|--------|
| `402` | Payment required or invalid payment | Execute payment and retry |
| `400` | Malformed payment header | Fix header format |
| `409` | Payment already used (replay attack) | Make new payment |
| `410` | Price expired | Request new price |
| `422` | Insufficient payment amount | Send correct amount |

## Implementation Guide

### Provider Implementation (Express.js)

```javascript
import express from 'express';
import { ethers } from 'ethers';

const app = express();
const PROVIDER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';
const PRICE = ethers.parseEther('0.1'); // 0.1 native token

// Payment verification cache
const usedPayments = new Set();

app.get('/api/premium/data', async (req, res) => {
  const paymentHeader = req.headers['x-payment'];
  
  // No payment header - return 402
  if (!paymentHeader) {
    return res.status(402)
      .setHeader('X-Cronos-Address', PROVIDER_ADDRESS)
      .setHeader('X-Cost', PRICE.toString())
      .setHeader('X-Asset-Type', 'native')
      .setHeader('X-Chain-Id', '240')
      .json({
        error: 'Payment Required',
        message: `This endpoint requires payment of ${ethers.formatEther(PRICE)} CRO`,
        payment: {
          recipient: PROVIDER_ADDRESS,
          amount: PRICE.toString(),
          amountFormatted: `${ethers.formatEther(PRICE)} CRO`
        }
      });
  }
  
  // Parse and verify payment
  const [txHash, chainId] = paymentHeader.split(':');
  
  if (usedPayments.has(txHash)) {
    return res.status(409).json({ error: 'Payment already used' });
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(getRpcUrl(chainId));
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed or not confirmed');
    }
    
    if (tx.to.toLowerCase() !== PROVIDER_ADDRESS.toLowerCase()) {
      throw new Error('Wrong recipient');
    }
    
    if (BigInt(tx.value) < BigInt(PRICE)) {
      throw new Error('Insufficient payment');
    }
    
    // Payment valid - mark as used
    usedPayments.add(txHash);
    
    // Return premium data
    res.json({
      data: 'Your premium data here',
      paid: true,
      txHash
    });
    
  } catch (error) {
    return res.status(402).json({
      error: 'Payment verification failed',
      message: error.message
    });
  }
});
```

### Client Implementation (Node.js)

```javascript
import axios from 'axios';
import { ethers } from 'ethers';

async function fetchPremiumData(url, wallet) {
  try {
    // Initial request
    const response = await axios.get(url, {
      validateStatus: status => status < 500
    });
    
    // If 200, return data
    if (response.status === 200) {
      return response.data;
    }
    
    // If 402, execute payment
    if (response.status === 402) {
      const recipient = response.headers['x-cronos-address'];
      const amount = response.headers['x-cost'];
      const chainId = response.headers['x-chain-id'];
      
      console.log(`Payment required: ${ethers.formatEther(amount)} to ${recipient}`);
      
      // Execute payment
      const tx = await wallet.sendTransaction({
        to: recipient,
        value: amount
      });
      
      console.log(`Payment sent: ${tx.hash}`);
      await tx.wait();
      
      // Retry with payment proof
      const retryResponse = await axios.get(url, {
        headers: {
          'X-PAYMENT': `${tx.hash}:${chainId}`
        }
      });
      
      return retryResponse.data;
    }
    
    throw new Error(`Unexpected status: ${response.status}`);
    
  } catch (error) {
    console.error('Error fetching premium data:', error);
    throw error;
  }
}

// Usage
const provider = new ethers.JsonRpcProvider('https://testnet.zkevm.cronos.org');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

const data = await fetchPremiumData('https://api.example.com/premium/data', wallet);
console.log(data);
```

## Security Considerations

### 1. Replay Attack Prevention

Providers MUST track used transaction hashes to prevent the same payment from being used multiple times. Recommended approaches:

- **Cache**: Store txHash in-memory with TTL (5-10 minutes)
- **Database**: Store txHash in persistent storage with timestamp
- **Bloom Filter**: For high-volume applications

### 2. Transaction Confirmation

Providers SHOULD wait for sufficient block confirmations before accepting payment:

- **Low-value**: 1 confirmation (15-30 seconds)
- **Medium-value**: 3-6 confirmations (1-2 minutes)
- **High-value**: 12+ confirmations (3-5 minutes)

### 3. Price Expiration

For volatile assets, providers SHOULD include `X-Expiry` header to prevent price manipulation during network congestion.

### 4. Amount Validation

Always compare amounts as BigInt/uint256 to avoid floating-point precision issues:

```javascript
if (BigInt(tx.value) < BigInt(requiredAmount)) {
  throw new Error('Insufficient payment');
}
```

## Multi-Chain Support

NIP-1 supports any EVM-compatible blockchain. Providers can specify multiple supported chains:

```json
{
  "supportedChains": [
    { "chainId": 240, "name": "Cronos zkEVM Testnet" },
    { "chainId": 84532, "name": "Base Sepolia" },
    { "chainId": 80002, "name": "Polygon Amoy" },
    { "chainId": 11155111, "name": "Ethereum Sepolia" }
  ]
}
```

Clients can choose any supported chain and include the chainId in the payment proof header.

## Use Cases

### 1. AI Agent Data Access

AI agents can autonomously access premium data without API keys:

```python
# AI Agent pseudocode
data = fetch_with_auto_payment(
    url="https://api.nexus.com/sentiment/btc",
    wallet=agent_wallet,
    max_price=0.5  # CRO
)
```

### 2. Micro-services Payment

Microservices can pay each other per-request:

```javascript
// Service A calls Service B
const result = await nexusPay.call({
  url: 'https://service-b.com/process',
  payment: { maxAmount: '0.01' }
});
```

### 3. DeFi Automation

DeFi protocols can access oracle data with guaranteed payment:

```solidity
// Smart contract integration (via oracle)
function getPrice() external returns (uint256) {
    // Oracle pays for data access using NIP-1
    return oracleClient.fetchPrice("BTC/USD");
}
```

## Backwards Compatibility

NIP-1 is fully backwards compatible with standard HTTP. Clients that don't implement the protocol will simply receive a 402 error with clear payment instructions.

## Reference Implementations

- **Provider Middleware**: [mock-provider](https://github.com/nexus-ecosystem/mock-provider)
- **Client SDK**: [@nexus-ecosystem/nip1](https://www.npmjs.com/package/@nexus-ecosystem/nip1)
- **Engine Integration**: [D8N Engine NexusPayNode](https://github.com/nexus-ecosystem/engine)

## Test Vectors

### Test Case 1: Basic Payment Flow

**Initial Request:**
```
GET /api/data HTTP/1.1
Host: api.example.com
```

**Response:**
```
HTTP/1.1 402 Payment Required
X-Cronos-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f5e123
X-Cost: 100000000000000000
X-Asset-Type: native
X-Chain-Id: 240
```

**Payment Execution:**
```
txHash: 0x1234...abcd
chainId: 240
```

**Retry Request:**
```
GET /api/data HTTP/1.1
Host: api.example.com
X-PAYMENT: 0x1234...abcd:240
```

**Success Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": "premium content"
}
```

## Changelog

- **v1.0 (2025-12-21)**: Initial specification release

## License

This specification is released under the MIT License.

## References

- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231)
- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [Ethereum JSON-RPC Specification](https://ethereum.org/en/developers/docs/apis/json-rpc/)

---

**For implementation support, visit:** https://github.com/nexus-ecosystem/nip1-sdk
