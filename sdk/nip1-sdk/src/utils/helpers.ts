import { ethers } from 'ethers';
import type { PaymentDetails, PaymentProof, NIP1Headers } from '../types/index.js';

/**
 * Parse a 402 Payment Required response to extract payment details
 */
export function parsePaymentRequired(
  response: any
): PaymentDetails | null {
  try {
    const headers = response.headers as Partial<NIP1Headers>;
    const data = response.data;

    // Try headers first, then response body
    const recipientRaw = headers['x-cronos-address'] || data?.payment?.recipient;
    const amountStr = headers['x-cost'] || data?.payment?.amount;
    const assetType = (headers['x-asset-type'] || data?.payment?.assetType || 'native') as 'native' | 'ERC20' | 'ERC721';
    const chainIdStr = headers['x-chain-id'] || data?.payment?.supportedChains?.[0]?.chainId?.toString() || '240';
    const tokenAddressRaw = headers['x-token-address'] || data?.payment?.tokenAddress;
    const supportedChains = data?.payment?.supportedChains;

    if (!recipientRaw || !amountStr) {
      return null;
    }

    // Normalize addresses to proper checksum format
    // Convert to lowercase first to avoid checksum validation errors, then get proper checksum
    const recipient = ethers.getAddress(recipientRaw.toLowerCase());
    const tokenAddress = tokenAddressRaw ? ethers.getAddress(tokenAddressRaw.toLowerCase()) : undefined;

    const amount = BigInt(amountStr);
    const chainId = parseInt(chainIdStr);
    const amountFormatted = ethers.formatEther(amount);

    return {
      recipient,
      amount,
      amountFormatted,
      chainId,
      assetType,
      tokenAddress,
      supportedChains
    };
  } catch (error) {
    console.error('[NIP1] Failed to parse payment required:', error);
    return null;
  }
}

/**
 * Create a payment proof header string
 */
export function createPaymentProof(txHash: string, chainId: number): string {
  if (!txHash) {
    throw new Error('Transaction hash is required');
  }
  if (!txHash.startsWith('0x')) {
    throw new Error('Transaction hash must start with 0x');
  }
  if (txHash.length !== 66) {
    throw new Error('Invalid transaction hash length');
  }
  return `${txHash}:${chainId}`;
}

/**
 * Parse a payment proof header
 */
export function parsePaymentProof(header: string): PaymentProof | null {
  try {
    const parts = header.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const [txHash, chainIdStr] = parts;
    
    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      return null;
    }

    const chainId = parseInt(chainIdStr);
    if (isNaN(chainId)) {
      return null;
    }

    return { txHash, chainId };
  } catch (error) {
    return null;
  }
}

/**
 * Get RPC URL for a chain ID
 */
export function getRpcUrl(chainId: number): string {
  const rpcUrls: Record<number, string> = {
    240: process.env.CRONOS_RPC_URL || 'https://testnet.zkevm.cronos.org',
    84532: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
    80002: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
    11155111: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  };

  return rpcUrls[chainId] || rpcUrls[240];
}

/**
 * Format amount with proper decimals
 */
export function formatAmount(amount: bigint | string, decimals: number = 18): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  return ethers.formatUnits(amountBigInt, decimals);
}

/**
 * Parse amount to wei/base units
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}
