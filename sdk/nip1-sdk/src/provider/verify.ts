import { ethers } from 'ethers';
import { getRpcUrl } from '../utils/helpers.js';
import type { VerificationResult } from '../types/index.js';

/**
 * Verify a payment transaction on-chain
 */
export async function verifyPayment(
  txHash: string,
  chainId: number,
  expectedAmount: bigint | string,
  expectedRecipient: string,
  confirmations: number = 1,
  maxAgeSeconds?: number
): Promise<VerificationResult> {
  try {
    // Get RPC provider for this chain
    const rpcUrl = getRpcUrl(chainId);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get transaction
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return {
        valid: false,
        error: 'Transaction not found'
      };
    }

    // Get receipt to check confirmation
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return {
        valid: false,
        error: 'Transaction not confirmed yet'
      };
    }

    // Check if transaction succeeded
    if (receipt.status !== 1) {
      return {
        valid: false,
        error: 'Transaction failed'
      };
    }

    // Check confirmations
    const currentBlock = await provider.getBlockNumber();
    const txConfirmations = currentBlock - (receipt.blockNumber || 0);
    
    if (txConfirmations < confirmations) {
      return {
        valid: false,
        error: `Insufficient confirmations (${txConfirmations}/${confirmations})`
      };
    }

    // Optional: expiration check (max age)
    if (typeof maxAgeSeconds === 'number' && receipt.blockNumber) {
      const txBlock = await provider.getBlock(receipt.blockNumber);
      const latestBlock = await provider.getBlock(currentBlock);
      const txTimestamp = Number(txBlock?.timestamp || 0);
      const latestTimestamp = Number(latestBlock?.timestamp || Date.now() / 1000);
      const ageSeconds = latestTimestamp - txTimestamp;
      if (ageSeconds > maxAgeSeconds) {
        return {
          valid: false,
          error: `Transaction expired (age ${Math.floor(ageSeconds)}s > ${maxAgeSeconds}s)`
        };
      }
    }

    // Verify recipient
    const recipientMatch = tx.to?.toLowerCase() === expectedRecipient.toLowerCase();
    if (!recipientMatch) {
      return {
        valid: false,
        error: `Wrong recipient. Expected: ${expectedRecipient}, Got: ${tx.to}`
      };
    }

    // Verify amount
    const expectedAmountBigInt = typeof expectedAmount === 'string' 
      ? BigInt(expectedAmount) 
      : expectedAmount;
    
    const txValue = BigInt(tx.value.toString());
    
    if (txValue < expectedAmountBigInt) {
      return {
        valid: false,
        error: `Insufficient amount. Expected: ${expectedAmountBigInt}, Got: ${txValue}`
      };
    }

    // All checks passed
    return {
      valid: true,
      transaction: {
        hash: txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        chainId: tx.chainId,
        blockNumber: receipt.blockNumber,
        confirmations: txConfirmations
      }
    };

  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Verification failed'
    };
  }
}

/**
 * Verify payment with automatic retry logic
 */
export async function verifyPaymentWithRetry(
  txHash: string,
  chainId: number,
  expectedAmount: bigint | string,
  expectedRecipient: string,
  confirmations: number = 1,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<VerificationResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await verifyPayment(
      txHash,
      chainId,
      expectedAmount,
      expectedRecipient,
      confirmations
    );

    if (result.valid) {
      return result;
    }

    lastError = result.error;

    // Don't retry on certain errors
    if (
      result.error?.includes('not found') ||
      result.error?.includes('Wrong recipient') ||
      result.error?.includes('failed')
    ) {
      return result;
    }

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return {
    valid: false,
    error: lastError || 'Verification failed after retries'
  };
}
