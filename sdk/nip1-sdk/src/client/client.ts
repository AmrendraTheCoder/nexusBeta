import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ethers } from 'ethers';
import { parsePaymentRequired, createPaymentProof } from '../utils/helpers.js';
import type { PaymentDetails } from '../types/index.js';

export interface NIP1ClientConfig {
  /**
   * Ethers wallet or signer for payments
   */
  wallet: ethers.Wallet | ethers.Signer;

  /**
   * Maximum price willing to pay (in native token)
   */
  maxPrice?: string | bigint;

  /**
   * Automatically pay and retry on 402
   */
  autoPay?: boolean;

  /**
   * Cache successful payments to avoid duplicate payments
   */
  enableCache?: boolean;

  /**
   * Custom axios instance
   */
  axiosInstance?: AxiosInstance;

  /**
   * Callback before payment
   */
  beforePayment?: (details: PaymentDetails) => Promise<boolean>;

  /**
   * Callback after payment
   */
  afterPayment?: (txHash: string, details: PaymentDetails) => Promise<void>;

  /**
   * Demo mode: Skip real transactions and return mock data (for testing)
   */
  demoMode?: boolean;
}

/**
 * Client for consuming NIP-1 payment-gated APIs
 * 
 * @example
 * const client = new NIP1Client({
 *   wallet: myWallet,
 *   maxPrice: '1.0', // 1 native token max
 *   autoPay: true
 * });
 * 
 * const data = await client.get('https://api.example.com/premium');
 */
export class NIP1Client {
  private wallet: ethers.Wallet | ethers.Signer;
  private maxPrice?: bigint;
  private autoPay: boolean;
  private enableCache: boolean;
  private axios: AxiosInstance;
  private beforePayment?: (details: PaymentDetails) => Promise<boolean>;
  private afterPayment?: (txHash: string, details: PaymentDetails) => Promise<void>;
  private paymentCache: Map<string, { txHash: string; chainId: number; timestamp: number }>;
  private demoMode: boolean;

  constructor(config: NIP1ClientConfig) {
    this.wallet = config.wallet;
    this.maxPrice = config.maxPrice 
      ? (typeof config.maxPrice === 'string' 
        ? ethers.parseEther(config.maxPrice)
        : config.maxPrice)
      : undefined;
    this.autoPay = config.autoPay !== false;
    this.enableCache = config.enableCache !== false;
    this.axios = config.axiosInstance || axios.create();
    this.beforePayment = config.beforePayment;
    this.afterPayment = config.afterPayment;
    this.paymentCache = new Map();
    this.demoMode = config.demoMode || false;
  }

  /**
   * GET request with automatic payment handling
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request with automatic payment handling
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * Generic request with automatic payment handling
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    if (!config.url) {
      throw new Error('URL is required');
    }

    // Check payment cache
    const cachedPayment = this.enableCache ? this.getFromCache(config.url) : null;
    
    if (cachedPayment) {
      const proof = createPaymentProof(cachedPayment.txHash, cachedPayment.chainId);
      config.headers = { ...config.headers, 'X-PAYMENT': proof };
    }

    try {
      // Initial request
      const response = await this.axios.request({
        ...config,
        validateStatus: (status) => status < 500
      });

      // Success - return data
      if (response.status === 200) {
        return response.data;
      }

      // Payment required
      if (response.status === 402) {
        if (!this.autoPay) {
          throw new Error('Payment required but autoPay is disabled');
        }

        return await this.handlePaymentRequired<T>(response, config);
      }

      // Other error
      throw new Error(`Request failed with status ${response.status}: ${response.data?.message || response.statusText}`);

    } catch (error: any) {
      if (error.response?.status === 402 && this.autoPay) {
        return await this.handlePaymentRequired<T>(error.response, config);
      }
      throw error;
    }
  }

  /**
   * Handle 402 Payment Required response
   */
  private async handlePaymentRequired<T>(response: any, config: AxiosRequestConfig): Promise<T> {
    // Parse payment details
    const paymentDetails = parsePaymentRequired(response);
    
    if (!paymentDetails) {
      throw new Error('Failed to parse payment details from 402 response');
    }

    // Check max price
    if (this.maxPrice && paymentDetails.amount > this.maxPrice) {
      throw new Error(
        `Price ${paymentDetails.amountFormatted} exceeds maximum ${ethers.formatEther(this.maxPrice)}`
      );
    }

    console.log(`[NIP1] Payment required: ${paymentDetails.amountFormatted} to ${paymentDetails.recipient}`);

    // Call beforePayment callback
    if (this.beforePayment) {
      const proceed = await this.beforePayment(paymentDetails);
      if (!proceed) {
        throw new Error('Payment cancelled by user');
      }
    }

    // Execute payment
    const txHash = await this.executePayment(paymentDetails);
    
    console.log(`[NIP1] Payment sent: ${txHash}`);

    // Call afterPayment callback
    if (this.afterPayment) {
      await this.afterPayment(txHash, paymentDetails);
    }

    // Cache the payment
    if (this.enableCache && config.url) {
      this.addToCache(config.url, txHash, paymentDetails.chainId);
    }

    // Retry request with payment proof
    const proof = createPaymentProof(txHash, paymentDetails.chainId);
    const retryResponse = await this.axios.request({
      ...config,
      headers: {
        ...config.headers,
        'X-PAYMENT': proof
      }
    });

    if (retryResponse.status !== 200) {
      throw new Error(`Payment accepted but request failed with status ${retryResponse.status}`);
    }

    return retryResponse.data;
  }

  /**
   * Execute payment transaction
   */
  private async executePayment(details: PaymentDetails): Promise<string> {
    try {
      // Demo mode: Skip real transaction, return mock hash
      if (this.demoMode) {
        console.log(`🎭 [SDK] Demo mode: Skipping real transaction`);
        const mockHash = '0x' + Math.random().toString(16).substring(2).padEnd(64, '0');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        return mockHash;
      }

      const tx = await this.wallet.sendTransaction({
        to: details.recipient,
        value: details.amount
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Ensure we have a valid transaction hash
      if (!receipt.hash) {
        throw new Error('Transaction receipt missing hash');
      }

      return receipt.hash;

    } catch (error: any) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Get payment from cache
   */
  private getFromCache(url: string): { txHash: string; chainId: number } | null {
    const cached = this.paymentCache.get(url);
    
    if (!cached) {
      return null;
    }

    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      this.paymentCache.delete(url);
      return null;
    }

    return cached;
  }

  /**
   * Add payment to cache
   */
  private addToCache(url: string, txHash: string, chainId: number): void {
    this.paymentCache.set(url, {
      txHash,
      chainId,
      timestamp: Date.now()
    });
  }

  /**
   * Clear payment cache
   */
  clearCache(): void {
    this.paymentCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.paymentCache.size;
  }
}
