import { Request, Response, NextFunction } from "express";
import { getEndpointPrice, verifyPayment, parsePaymentHeader } from "../utils/verifyPayment.js";
import { ethers } from "ethers";

// Cache of verified payments (txHash -> timestamp)
const verifiedPayments = new Map<string, number>();

// Payment cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Middleware that implements HTTP 402 Payment Required
 * 
 * Flow:
 * 1. Check for X-PAYMENT header
 * 2. If no header, return 402 with payment details
 * 3. If header exists, verify payment on-chain
 * 4. If valid, allow request through
 * 5. If invalid, return 402 again
 */
export function paywallMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const paymentHeader = req.headers["x-payment"] as string;

  // Get price for this endpoint
  const price = getEndpointPrice(path);
  const providerAddress = process.env.PROVIDER_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123";

  // If no payment header, return 402
  if (!paymentHeader) {
    return send402Response(res, providerAddress, price, path);
  }

  // Parse payment header
  const paymentInfo = parsePaymentHeader(paymentHeader);
  if (!paymentInfo) {
    return send402Response(res, providerAddress, price, path, "Invalid payment header format");
  }

  const { txHash, chainId } = paymentInfo;

  // Check payment cache first
  const cachedTime = verifiedPayments.get(txHash);
  if (cachedTime && Date.now() - cachedTime < CACHE_DURATION) {
    console.log(`[PAYWALL] Cached payment accepted: ${txHash}`);
    return next();
  }

  // Verify payment on-chain
  verifyPayment(txHash, chainId, price, providerAddress)
    .then((result) => {
      if (result.valid) {
        console.log(`[PAYWALL] Payment verified: ${txHash} on chain ${chainId}`);
        verifiedPayments.set(txHash, Date.now());
        next();
      } else {
        console.log(`[PAYWALL] Payment invalid: ${result.error}`);
        send402Response(res, providerAddress, price, path, result.error);
      }
    })
    .catch((error) => {
      console.error("[PAYWALL] Verification error:", error);
      send402Response(res, providerAddress, price, path, "Payment verification failed");
    });
}

/**
 * Send 402 Payment Required response with NIP-1 headers
 */
function send402Response(
  res: Response, 
  providerAddress: string, 
  price: bigint, 
  path: string,
  error?: string
) {
  res.status(402);
  
  // NIP-1 Headers
  res.setHeader("X-Cronos-Address", providerAddress);
  res.setHeader("X-Cost", price.toString());
  res.setHeader("X-Asset-Type", "native");
  res.setHeader("X-Chain-Id", "240"); // Default to Cronos zkEVM
  res.setHeader("X-Supported-Chains", "240,84532,80002,11155111");
  res.setHeader("X-Payment-Format", "txHash:chainId");

  res.json({
    error: "Payment Required",
    message: error || `This endpoint requires payment of ${ethers.formatEther(price)} CRO`,
    endpoint: path,
    payment: {
      recipient: providerAddress,
      amount: price.toString(),
      amountFormatted: `${ethers.formatEther(price)} CRO`,
      assetType: "native",
      supportedChains: [
        { chainId: 240, name: "Cronos zkEVM Testnet" },
        { chainId: 84532, name: "Base Sepolia" },
        { chainId: 80002, name: "Polygon Amoy" },
        { chainId: 11155111, name: "Ethereum Sepolia" },
      ],
      instructions: "Send payment to the recipient address, then retry with header: X-PAYMENT: <txHash>:<chainId>",
    },
  });
}

/**
 * Cleanup old cached payments periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [txHash, timestamp] of verifiedPayments.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      verifiedPayments.delete(txHash);
    }
  }
}, 60000); // Cleanup every minute
