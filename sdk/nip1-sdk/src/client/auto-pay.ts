import { ethers } from 'ethers';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { parsePaymentRequired, createPaymentProof } from '../utils/helpers.js';

export interface AutoPayConfig {
  wallet: ethers.Wallet | ethers.Signer;
  maxPrice?: string | bigint;
}

/**
 * Wrapper for fetch/axios that automatically handles NIP-1 payments
 * 
 * @example
 * const data = await autoPayFetch(
 *   'https://api.example.com/premium',
 *   { wallet: myWallet, maxPrice: '1.0' }
 * );
 */
export async function autoPayFetch<T = any>(
  url: string,
  config: AutoPayConfig,
  axiosConfig?: AxiosRequestConfig
): Promise<T> {
  const maxPrice = config.maxPrice
    ? (typeof config.maxPrice === 'string'
      ? ethers.parseEther(config.maxPrice)
      : config.maxPrice)
    : undefined;

  try {
    // Initial request
    const response = await axios.request({
      ...axiosConfig,
      url,
      validateStatus: (status) => status < 500
    });

    // Success
    if (response.status === 200) {
      return response.data;
    }

    // Payment required
    if (response.status === 402) {
      return await handlePayment<T>(url, response, config.wallet, maxPrice, axiosConfig);
    }

    throw new Error(`Request failed with status ${response.status}`);

  } catch (error: any) {
    if (error.response?.status === 402) {
      return await handlePayment<T>(url, error.response, config.wallet, maxPrice, axiosConfig);
    }
    throw error;
  }
}

/**
 * Handle payment and retry request
 */
async function handlePayment<T>(
  url: string,
  response: AxiosResponse,
  wallet: ethers.Wallet | ethers.Signer,
  maxPrice: bigint | undefined,
  axiosConfig?: AxiosRequestConfig
): Promise<T> {
  // Parse payment details
  const paymentDetails = parsePaymentRequired(response);

  if (!paymentDetails) {
    throw new Error('Failed to parse payment details from 402 response');
  }

  // Check max price
  if (maxPrice && paymentDetails.amount > maxPrice) {
    throw new Error(
      `Price ${paymentDetails.amountFormatted} exceeds maximum ${ethers.formatEther(maxPrice)}`
    );
  }

  console.log(`[AUTO-PAY] Paying ${paymentDetails.amountFormatted} to ${paymentDetails.recipient}`);

  // Execute payment
  const tx = await wallet.sendTransaction({
    to: paymentDetails.recipient,
    value: paymentDetails.amount
  });

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error('Payment transaction failed');
  }

  console.log(`[AUTO-PAY] Payment successful: ${receipt.hash}`);

  // Retry with payment proof
  const proof = createPaymentProof(receipt.hash, paymentDetails.chainId);
  const retryResponse = await axios.request({
    ...axiosConfig,
    url,
    headers: {
      ...axiosConfig?.headers,
      'X-PAYMENT': proof
    }
  });

  if (retryResponse.status !== 200) {
    throw new Error(`Payment accepted but request failed: ${retryResponse.status}`);
  }

  return retryResponse.data;
}
