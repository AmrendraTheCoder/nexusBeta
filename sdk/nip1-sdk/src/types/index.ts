/**
 * Type definitions for NIP-1 protocol
 */

export interface NIP1Headers {
  'x-cronos-address': string;
  'x-cost': string;
  'x-asset-type': 'native' | 'ERC20' | 'ERC721';
  'x-chain-id': string;
  'x-supported-chains'?: string;
  'x-payment-format'?: string;
  'x-token-address'?: string;
  'x-expiry'?: string;
}

export interface SupportedChain {
  chainId: number;
  name: string;
  rpcUrl?: string;
}

export interface NIP1Response {
  error: string;
  message: string;
  endpoint: string;
  payment: {
    recipient: string;
    amount: string;
    amountFormatted: string;
    assetType: 'native' | 'ERC20' | 'ERC721';
    supportedChains?: SupportedChain[];
    instructions?: string;
  };
}

export interface PaymentConfig {
  recipient: string;
  amount: string | bigint;
  chainId: number;
  assetType?: 'native' | 'ERC20' | 'ERC721';
  tokenAddress?: string;
}

export interface PaymentDetails {
  recipient: string;
  amount: bigint;
  amountFormatted: string;
  chainId: number;
  assetType: 'native' | 'ERC20' | 'ERC721';
  tokenAddress?: string;
  supportedChains?: SupportedChain[];
}

export interface PaymentProof {
  txHash: string;
  chainId: number;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  transaction?: any;
}
