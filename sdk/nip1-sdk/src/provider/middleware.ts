import type { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { parsePaymentProof } from '../utils/helpers.js';
import { verifyPayment } from './verify.js';
import { PaymentCache } from './cache.js';

export interface PaywallConfig {
  /**
   * Payment recipient address
   */
  recipient: string;

  /**
   * Price in wei or formatted string (e.g., "0.1")
   */
  price: bigint | string;

  /**
   * Chain ID (default: 240 - Cronos zkEVM)
   */
  chainId?: number;

  /**
   * Supported chain IDs for multi-chain payments
   */
  supportedChains?: number[];

  /**
   * Required confirmations (default: 1)
   */
  confirmations?: number;

  /**
   * Custom payment cache (optional)
   */
  cache?: PaymentCache;

  /**
   * Custom error handler
   */
  onError?: (error: string, req: Request, res: Response) => void;

  /**
   * Custom success handler
   */
  onSuccess?: (txHash: string, req: Request) => void;

  /**
   * Optional: consider payments older than this as expired (in seconds)
   */
  maxAgeSeconds?: number;
}

/**
 * Express middleware for implementing NIP-1 paywall
 * 
 * @example
 * app.get('/premium', requirePayment({
 *   recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
 *   price: ethers.parseEther('0.1'),
 *   chainId: 240
 * }), (req, res) => {
 *   res.json({ data: 'premium content' });
 * });
 */
export function requirePayment(config: PaywallConfig) {
  // Parse price
  const price = typeof config.price === 'string'
    ? ethers.parseEther(config.price)
    : config.price;

  const chainId = config.chainId || 240;
  const supportedChains = config.supportedChains || [chainId];
  const confirmations = config.confirmations || 1;
  const cache = config.cache || new PaymentCache();

  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers['x-payment'] as string;

    // No payment header - return 402
    if (!paymentHeader) {
      return send402Response(res, config.recipient, price, chainId, supportedChains, req.path);
    }

    // Parse payment proof
    const proof = parsePaymentProof(paymentHeader);
    if (!proof) {
      return send402Response(
        res,
        config.recipient,
        price,
        chainId,
        supportedChains,
        req.path,
        'Invalid payment header format. Expected: txHash:chainId'
      );
    }

    const { txHash, chainId: paymentChainId } = proof;

    // Check if chain is supported
    if (!supportedChains.includes(paymentChainId)) {
      return send402Response(
        res,
        config.recipient,
        price,
        chainId,
        supportedChains,
        req.path,
        `Chain ${paymentChainId} not supported`
      );
    }

    // Check cache for replay attack
    if (cache.has(txHash)) {
      return res.status(409).json({
        error: 'Payment already used',
        message: 'This payment has already been used. Please make a new payment.',
        txHash
      });
    }

    // Verify payment on-chain
    try {
      const result = await verifyPayment(
        txHash,
        paymentChainId,
        price,
        config.recipient,
        confirmations,
        config.maxAgeSeconds
      );

      if (!result.valid) {
        const errorMsg = result.error || 'Payment verification failed';
        
        if (config.onError) {
          config.onError(errorMsg, req, res);
          return;
        }

        return send402Response(
          res,
          config.recipient,
          price,
          chainId,
          supportedChains,
          req.path,
          errorMsg
        );
      }

      // Payment valid - cache it and proceed
      cache.add(txHash);
      
      // Call success handler if provided
      if (config.onSuccess) {
        config.onSuccess(txHash, req);
      }

      // Attach payment info to request for downstream use
      (req as any).payment = {
        txHash,
        chainId: paymentChainId,
        verified: true,
        transaction: result.transaction
      };

      next();

    } catch (error: any) {
      const errorMsg = error.message || 'Payment verification error';
      
      if (config.onError) {
        config.onError(errorMsg, req, res);
        return;
      }

      return send402Response(
        res,
        config.recipient,
        price,
        chainId,
        supportedChains,
        req.path,
        errorMsg
      );
    }
  };
}

/**
 * Send 402 Payment Required response
 */
function send402Response(
  res: Response,
  recipient: string,
  price: bigint,
  chainId: number,
  supportedChains: number[],
  endpoint: string,
  error?: string
) {
  // Set NIP-1 headers
  res.status(402);
  res.setHeader('X-Cronos-Address', recipient);
  res.setHeader('X-Cost', price.toString());
  res.setHeader('X-Asset-Type', 'native');
  res.setHeader('X-Chain-Id', chainId.toString());
  res.setHeader('X-Supported-Chains', supportedChains.join(','));
  res.setHeader('X-Payment-Format', 'txHash:chainId');

  // Chain info mapping
  const chainInfo: Record<number, { name: string; rpcUrl: string }> = {
    240: { name: 'Cronos zkEVM Testnet', rpcUrl: 'https://testnet.zkevm.cronos.org' },
    84532: { name: 'Base Sepolia', rpcUrl: 'https://sepolia.base.org' },
    80002: { name: 'Polygon Amoy', rpcUrl: 'https://rpc-amoy.polygon.technology' },
    11155111: { name: 'Ethereum Sepolia', rpcUrl: 'https://rpc.sepolia.org' }
  };

  res.json({
    error: 'Payment Required',
    message: error || `This endpoint requires payment of ${ethers.formatEther(price)} tokens`,
    endpoint,
    payment: {
      recipient,
      amount: price.toString(),
      amountFormatted: `${ethers.formatEther(price)} tokens`,
      assetType: 'native',
      supportedChains: supportedChains.map(id => ({
        chainId: id,
        name: chainInfo[id]?.name || `Chain ${id}`,
        rpcUrl: chainInfo[id]?.rpcUrl
      })),
      instructions: 'Send payment to the recipient address, then retry with header: X-PAYMENT: <txHash>:<chainId>'
    }
  });
}
