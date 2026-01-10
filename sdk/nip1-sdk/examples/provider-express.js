/**
 * NIP-1 Provider Example - Express Mock API
 * 
 * This creates a simple Express server with 3 endpoints:
 * - /free - No payment required
 * - /premium - Requires 0.1 token payment
 * - /expensive - Requires 0.5 token payment
 * 
 * Run this to test the NexusPayNode SDK integration:
 * $ node provider-express.js
 * 
 * Then make requests from the engine or use curl:
 * $ curl http://localhost:3000/premium
 */

import express from 'express';
import { requirePayment } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

const app = express();
const PORT = 3000;

// Test wallet address (this receives payments)
const RECIPIENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';
const CHAIN_ID = 84532; // Base Sepolia

// RPC provider for payment verification
const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');

console.log('🚀 Starting NIP-1 Mock Provider...');
console.log(`💰 Payment Recipient: ${RECIPIENT_ADDRESS}`);
console.log(`⛓️  Chain: Base Sepolia (${CHAIN_ID})`);

// ============================================================================
// FREE ENDPOINT - No payment required
// ============================================================================
app.get('/free', (req, res) => {
  console.log('✅ [/free] Request received - No payment required');
  res.json({
    message: 'Free public data',
    data: 'Anyone can access this!',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// PREMIUM ENDPOINT - Requires 0.1 token payment
// ============================================================================
app.get('/premium', 
  requirePayment({
    provider,
    recipient: RECIPIENT_ADDRESS,
    amount: ethers.utils.parseEther('0.1'),
    chainId: CHAIN_ID,
    confirmations: 1,
    maxAgeSeconds: 300, // Payment must be within last 5 minutes
    assetType: 'native'
  }),
  (req, res) => {
    console.log(`✅ [/premium] Payment verified! Returning premium data...`);
    res.json({
      message: 'Premium crypto data unlocked! 🎉',
      price: {
        BTC: '$43,521',
        ETH: '$2,289',
        MATIC: '$0.89'
      },
      timestamp: new Date().toISOString(),
      accessLevel: 'premium'
    });
  }
);

// ============================================================================
// EXPENSIVE ENDPOINT - Requires 0.5 token payment
// ============================================================================
app.get('/expensive',
  requirePayment({
    provider,
    recipient: RECIPIENT_ADDRESS,
    amount: ethers.utils.parseEther('0.5'),
    chainId: CHAIN_ID,
    confirmations: 1,
    maxAgeSeconds: 300,
    assetType: 'native'
  }),
  (req, res) => {
    console.log(`✅ [/expensive] Payment verified! Returning expensive data...`);
    res.json({
      message: 'Exclusive institutional-grade data unlocked! 💎',
      analytics: {
        marketSentiment: 'Bullish',
        volatilityIndex: 42.3,
        liquidityScore: 8.7,
        riskMetrics: {
          sharpe: 1.83,
          sortino: 2.14,
          maxDrawdown: '18.4%'
        }
      },
      predictions: {
        nextWeek: '+12.3%',
        nextMonth: '+28.7%'
      },
      timestamp: new Date().toISOString(),
      accessLevel: 'institutional'
    });
  }
);

// ============================================================================
// ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log('');
  console.log('✅ NIP-1 Mock Provider is running!');
  console.log('');
  console.log('📍 Endpoints:');
  console.log(`   GET http://localhost:${PORT}/free       - No payment`);
  console.log(`   GET http://localhost:${PORT}/premium    - 0.1 token payment`);
  console.log(`   GET http://localhost:${PORT}/expensive  - 0.5 token payment`);
  console.log('');
  console.log('💡 Test with curl:');
  console.log(`   curl http://localhost:${PORT}/free`);
  console.log(`   curl http://localhost:${PORT}/premium`);
  console.log('');
  console.log('🔧 Or use the engine with test-nexuspay-sdk.json workflow');
  console.log('');
});
