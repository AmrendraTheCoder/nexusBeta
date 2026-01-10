/**
 * Tests for utility helper functions
 */

import {
  parsePaymentRequired,
  createPaymentProof,
  parsePaymentProof,
  getRpcUrl,
  formatAmount,
  parseAmount
} from '../src/utils/helpers';
import { ethers } from 'ethers';

describe('Utility Helpers', () => {
  describe('parsePaymentRequired', () => {
    it('should parse valid 402 response with headers', () => {
      const response = {
        status: 402,
        headers: {
          'x-cronos-address': '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
          'x-cost': '100000000000000000',
          'x-asset-type': 'native',
          'x-chain-id': '240'
        },
        data: {}
      };

      const result = parsePaymentRequired(response);

      expect(result).not.toBeNull();
      expect(result?.recipient).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f5e123');
      expect(result?.amount).toBe(BigInt('100000000000000000'));
      expect(result?.chainId).toBe(240);
      expect(result?.assetType).toBe('native');
    });

    it('should parse valid 402 response with body data', () => {
      const response = {
        status: 402,
        headers: {},
        data: {
          payment: {
            recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
            amount: '100000000000000000',
            assetType: 'native',
            supportedChains: [{ chainId: 240 }]
          }
        }
      };

      const result = parsePaymentRequired(response);

      expect(result).not.toBeNull();
      expect(result?.recipient).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f5e123');
      expect(result?.amount).toBe(BigInt('100000000000000000'));
      expect(result?.chainId).toBe(240);
    });

    it('should return null for invalid response', () => {
      const response = {
        status: 402,
        headers: {},
        data: {}
      };

      const result = parsePaymentRequired(response);
      expect(result).toBeNull();
    });

    it('should format amount correctly', () => {
      const response = {
        status: 402,
        headers: {
          'x-cronos-address': '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
          'x-cost': ethers.parseEther('0.5').toString(),
          'x-chain-id': '240'
        },
        data: {}
      };

      const result = parsePaymentRequired(response);
      expect(result?.amountFormatted).toBe('0.5');
    });
  });

  describe('createPaymentProof', () => {
    it('should create valid payment proof', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const chainId = 240;

      const proof = createPaymentProof(txHash, chainId);
      expect(proof).toBe(`${txHash}:${chainId}`);
    });

    it('should throw error for invalid txHash (no 0x)', () => {
      const txHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(() => createPaymentProof(txHash, 240)).toThrow('must start with 0x');
    });

    it('should throw error for invalid txHash length', () => {
      const txHash = '0x1234';
      expect(() => createPaymentProof(txHash, 240)).toThrow('Invalid transaction hash length');
    });
  });

  describe('parsePaymentProof', () => {
    it('should parse valid payment proof', () => {
      const proof = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:240';
      const result = parsePaymentProof(proof);

      expect(result).not.toBeNull();
      expect(result?.txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(result?.chainId).toBe(240);
    });

    it('should return null for invalid format', () => {
      expect(parsePaymentProof('invalid')).toBeNull();
      expect(parsePaymentProof('0x123:abc')).toBeNull();
      expect(parsePaymentProof('0x123')).toBeNull();
    });

    it('should return null for invalid txHash', () => {
      expect(parsePaymentProof('1234:240')).toBeNull();
      expect(parsePaymentProof('0x123:240')).toBeNull();
    });
  });

  describe('getRpcUrl', () => {
    it('should return correct RPC URLs', () => {
      expect(getRpcUrl(240)).toContain('cronos');
      expect(getRpcUrl(84532)).toContain('base');
      expect(getRpcUrl(80002)).toContain('polygon');
      expect(getRpcUrl(11155111)).toContain('sepolia');
    });

    it('should return default RPC for unknown chain', () => {
      const url = getRpcUrl(999999);
      expect(url).toContain('cronos'); // Default fallback
    });
  });

  describe('formatAmount', () => {
    it('should format bigint amounts', () => {
      const amount = ethers.parseEther('1.5');
      expect(formatAmount(amount)).toBe('1.5');
    });

    it('should format string amounts', () => {
      const amount = ethers.parseEther('0.123').toString();
      expect(formatAmount(amount)).toBe('0.123');
    });

    it('should handle custom decimals', () => {
      const amount = BigInt('1000000'); // 1 USDC (6 decimals)
      expect(formatAmount(amount, 6)).toBe('1.0');
    });
  });

  describe('parseAmount', () => {
    it('should parse ether amounts', () => {
      const amount = parseAmount('1.5');
      expect(amount).toBe(ethers.parseEther('1.5'));
    });

    it('should handle custom decimals', () => {
      const amount = parseAmount('1.0', 6);
      expect(amount).toBe(BigInt('1000000'));
    });
  });
});
