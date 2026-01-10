/**
 * Basic Provider Example
 * 
 * This example shows how to create a simple Express API with NIP-1 payment gating.
 */

import express from 'express';
import { requirePayment } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

const app = express();
const PORT = 4000;

// Your payment recipient address
const RECIPIENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';

// Free endpoint - no payment required
app.get('/', (req, res) => {
  res.json({
    service: 'My Premium API',
    status: 'healthy',
    endpoints: {
      free: ['/'],
      premium: ['/api/data', '/api/analytics']
    }
  });
});

// Premium endpoint - requires 0.1 CRO payment
app.get('/api/data', 
  requirePayment({
    recipient: RECIPIENT_ADDRESS,
    price: ethers.parseEther('0.1'),
    chainId: 240, // Cronos zkEVM Testnet
    supportedChains: [240, 84532, 80002], // Cronos, Base, Polygon
    confirmations: 1
  }),
  (req, res) => {
    // This handler only runs after successful payment
    res.json({
      data: 'Your premium data here',
      message: 'Payment verified successfully',
      // Access payment info from request
      payment: (req as any).payment
    });
  }
);

// Another premium endpoint - higher price
app.get('/api/analytics',
  requirePayment({
    recipient: RECIPIENT_ADDRESS,
    price: ethers.parseEther('0.5'),
    chainId: 240
  }),
  (req, res) => {
    res.json({
      analytics: {
        metric1: 42,
        metric2: 'valuable insight'
      }
    });
  }
);

// Custom error handling
app.get('/api/custom',
  requirePayment({
    recipient: RECIPIENT_ADDRESS,
    price: ethers.parseEther('0.2'),
    chainId: 240,
    onError: (error, req, res) => {
      console.error('Payment error:', error);
      res.status(402).json({
        error: 'Payment verification failed',
        details: error,
        contactSupport: 'support@example.com'
      });
    },
    onSuccess: (txHash, req) => {
      console.log('Payment received:', txHash);
      // Log to database, send analytics, etc.
    }
  }),
  (req, res) => {
    res.json({ data: 'custom endpoint data' });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💰 Accepting payments at: ${RECIPIENT_ADDRESS}`);
  console.log(`⛓️  Supported chains: Cronos zkEVM (240), Base (84532), Polygon (80002)`);
});

export default app;
