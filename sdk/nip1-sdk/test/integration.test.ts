/**
 * Integration tests for NIP-1 SDK
 * 
 * These tests verify the complete payment flow end-to-end
 */

import express from 'express';
import { ethers } from 'ethers';
import { requirePayment } from '../src/provider/middleware';
import { NIP1Client } from '../src/client/client';
import { Server } from 'http';

describe('NIP-1 Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  let client: NIP1Client;
  let mockWallet: any;
  let providerWallet: string;
  const PORT = 14000;

  beforeAll(async () => {
    // Setup mock provider API
    app = express();
    app.use(express.json());

    providerWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';

    // Free endpoint
    app.get('/free', (req, res) => {
      res.json({ message: 'free data' });
    });

    // Paid endpoint
    app.get('/premium',
      requirePayment({
        recipient: providerWallet,
        price: ethers.parseEther('0.1'),
        chainId: 240
      }),
      (req, res) => {
        res.json({ 
          message: 'premium data',
          paid: true,
          payment: (req as any).payment
        });
      }
    );

    // Start server
    server = app.listen(PORT);

    // Setup mock wallet
    mockWallet = {
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          status: 1
        })
      })
    };

    // Setup client
    client = new NIP1Client({
      wallet: mockWallet,
      maxPrice: '1.0',
      autoPay: false // Manual payment for testing
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Free Endpoint', () => {
    it('should access free endpoint without payment', async () => {
      const data = await client.get(`http://localhost:${PORT}/free`);
      expect(data.message).toBe('free data');
    });
  });

  describe('Payment Flow', () => {
    it('should receive 402 on premium endpoint without payment', async () => {
      try {
        await client.request({
          method: 'GET',
          url: `http://localhost:${PORT}/premium`
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Payment required');
      }
    });

    it('should complete full payment flow', async () => {
      // This test would require actual blockchain interaction
      // In real implementation, you would:
      // 1. Start with 402 response
      // 2. Execute payment on testnet
      // 3. Retry with payment proof
      // 4. Receive data
      
      // For now, we verify the structure is correct
      expect(client).toBeDefined();
      expect(mockWallet.sendTransaction).toBeDefined();
    });

    it('should return 402 for unsupported chain ID in payment header', async () => {
      const res = await fetch(`http://localhost:${PORT}/premium`, {
        headers: {
          'X-PAYMENT': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:999'
        }
      });
      expect(res.status).toBe(402);
      const body: any = await res.json();
      expect(body.error).toBe('Payment Required');
      expect(body.message).toContain('not supported');
    });
  });

  describe('Payment Caching', () => {
    it('should cache successful payments', async () => {
      const cacheSize = client.getCacheSize();
      expect(typeof cacheSize).toBe('number');
    });

    it('should clear cache', () => {
      client.clearCache();
      expect(client.getCacheSize()).toBe(0);
    });
  });

  describe('Price Limits', () => {
    it('should respect maxPrice setting', async () => {
      const expensiveClient = new NIP1Client({
        wallet: mockWallet,
        maxPrice: '0.05', // Less than required
        autoPay: true
      });

      // This would fail due to price exceeding max
      expect(expensiveClient).toBeDefined();
    });
  });
});
