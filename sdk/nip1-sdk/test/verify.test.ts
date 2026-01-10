/**
 * Tests for payment verification
 */

import { verifyPayment, verifyPaymentWithRetry } from '../src/provider/verify';
import { ethers } from 'ethers';

const createMockProvider = () => ({
  getTransaction: jest.fn(),
  getTransactionReceipt: jest.fn(),
  getBlockNumber: jest.fn(),
  getBlock: jest.fn()
});

describe('Payment Verification', () => {
  let mockProvider: ReturnType<typeof createMockProvider>;
  let providerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockProvider = createMockProvider();
    providerSpy = jest.spyOn(ethers, 'JsonRpcProvider' as any).mockImplementation(() => mockProvider as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    providerSpy.mockRestore();
  });

  describe('verifyPayment', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const chainId = 240;
    const amount = ethers.parseEther('0.1');
    const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';

    it('should verify valid payment', async () => {
      const mockTx = {
        hash: txHash,
        from: '0xSender',
        to: recipient,
        value: amount,
        chainId
      };

      const mockReceipt = {
        hash: txHash,
        status: 1,
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(105);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.hash).toBe(txHash);
    });

    it('should fail if transaction not found', async () => {
      mockProvider.getTransaction.mockResolvedValue(null);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail if transaction not confirmed', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: amount
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(null);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not confirmed');
    });

    it('should fail if transaction failed', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: amount
      };

      const mockReceipt = {
        hash: txHash,
        status: 0, // Failed
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('failed');
    });

    it('should fail if recipient is wrong', async () => {
      const wrongRecipient = '0xWrongAddress';
      
      const mockTx = {
        hash: txHash,
        to: wrongRecipient,
        value: amount
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(105);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Wrong recipient');
    });

    it('should fail if amount is insufficient', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: ethers.parseEther('0.05') // Less than required
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(105);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient amount');
    });

    it('should accept overpayment', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: ethers.parseEther('0.2') // More than required
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(105);

      const result = await verifyPayment(txHash, chainId, amount, recipient);

      expect(result.valid).toBe(true);
    });

    it('should check confirmation count', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: amount
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(102); // Only 2 confirmations

      const result = await verifyPayment(
        txHash,
        chainId,
        amount,
        recipient,
        5 // Require 5 confirmations
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient confirmations');
    });

    it('should fail expired transactions when maxAgeSeconds set', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: amount
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      // Simulate old timestamp
      mockProvider.getTransaction.mockResolvedValue(mockTx);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValue(200);
      mockProvider.getBlock
        .mockResolvedValueOnce({ timestamp: 1_000_000_000 }) // tx block
        .mockResolvedValueOnce({ timestamp: 1_000_000_000 + 10_000 }); // latest block (10k seconds later)

      const result = await verifyPayment(
        txHash,
        chainId,
        amount,
        recipient,
        1,
        3600 // maxAgeSeconds = 1 hour
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('verifyPaymentWithRetry', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const chainId = 240;
    const amount = ethers.parseEther('0.1');
    const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';

    it('should retry on transient errors', async () => {
      const mockTx = {
        hash: txHash,
        to: recipient,
        value: amount
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 100
      };

      // First call: not confirmed yet
      // Second call: success
      mockProvider.getTransaction
        .mockResolvedValueOnce(mockTx)
        .mockResolvedValueOnce(mockTx);

      mockProvider.getTransactionReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      mockProvider.getBlockNumber.mockResolvedValue(105);

      const result = await verifyPaymentWithRetry(
        txHash,
        chainId,
        amount,
        recipient,
        1,
        2, // Max 2 retries
        100 // 100ms delay
      );

      expect(result.valid).toBe(true);
      expect(mockProvider.getTransaction).toHaveBeenCalledTimes(2);
    });

    it('should not retry on permanent errors', async () => {
      mockProvider.getTransaction.mockResolvedValue(null);

      const result = await verifyPaymentWithRetry(
        txHash,
        chainId,
        amount,
        recipient,
        1,
        3,
        100
      );

      expect(result.valid).toBe(false);
      expect(mockProvider.getTransaction).toHaveBeenCalledTimes(1); // No retries
    });
  });
});
