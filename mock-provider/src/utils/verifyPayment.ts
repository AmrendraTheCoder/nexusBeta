import { ethers } from "ethers";

/**
 * Pricing configuration for all endpoints
 * Prices are in native token (CRO/ETH) wei
 */
export const ENDPOINT_PRICES: Record<string, bigint> = {
  // News - 0.1 CRO
  "/api/news/crypto": ethers.parseEther("0.1"),
  "/api/news/stocks": ethers.parseEther("0.15"),
  
  // Sentiment - 0.2 CRO
  "/api/sentiment/btc": ethers.parseEther("0.2"),
  "/api/sentiment/eth": ethers.parseEther("0.2"),
  
  // Charts - 0.3 CRO
  "/api/charts/btc/1h": ethers.parseEther("0.3"),
  "/api/charts/eth/1d": ethers.parseEther("0.3"),
  
  // On-Chain - 0.1-0.5 CRO
  "/api/onchain/whale-alerts": ethers.parseEther("0.5"),
  "/api/onchain/gas-estimate": ethers.parseEther("0.1"),
  
  // DeFi - 0.2-0.25 CRO
  "/api/defi/yields": ethers.parseEther("0.25"),
  "/api/defi/tvl": ethers.parseEther("0.2"),
  
  // NFT - 0.4 CRO
  "/api/nft/trending": ethers.parseEther("0.4"),
  
  // AI Predictions - 1.0 CRO
  "/api/predictions/btc": ethers.parseEther("1.0"),
};

/**
 * RPC URLs for different chains
 */
export const RPC_URLS: Record<number, string> = {
  240: process.env.CRONOS_RPC_URL || "https://testnet.zkevm.cronos.org",
  84532: process.env.BASE_RPC_URL || "https://sepolia.base.org",
  80002: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
  11155111: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
};

/**
 * Get price for an endpoint
 */
export function getEndpointPrice(path: string): bigint {
  return ENDPOINT_PRICES[path] || ethers.parseEther("0.1");
}

/**
 * Verify a payment transaction on the specified chain
 * @param txHash Transaction hash
 * @param chainId Chain ID
 * @param expectedAmount Expected payment amount
 * @param expectedRecipient Expected recipient address
 */
export async function verifyPayment(
  txHash: string,
  chainId: number,
  expectedAmount: bigint,
  expectedRecipient: string
): Promise<{ valid: boolean; error?: string }> {
  // Demo mode - always return valid
  if (process.env.DEMO_MODE === "true") {
    console.log(`[DEMO MODE] Simulating payment verification for tx: ${txHash}`);
    return { valid: true };
  }

  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    return { valid: false, error: `Unsupported chain ID: ${chainId}` };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return { valid: false, error: "Transaction not found" };
    }

    // Check if transaction is confirmed
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return { valid: false, error: "Transaction not confirmed or failed" };
    }

    // Check recipient
    if (tx.to?.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return { valid: false, error: "Payment sent to wrong address" };
    }

    // Check amount (allow 1% tolerance for gas variations)
    const minAmount = (expectedAmount * 99n) / 100n;
    if (tx.value < minAmount) {
      return { 
        valid: false, 
        error: `Insufficient payment: sent ${ethers.formatEther(tx.value)}, required ${ethers.formatEther(expectedAmount)}` 
      };
    }

    return { valid: true };
  } catch (error: any) {
    console.error("Payment verification error:", error.message);
    return { valid: false, error: `Verification failed: ${error.message}` };
  }
}

/**
 * Parse payment header
 * Expected format: txHash:chainId or just txHash (defaults to Cronos)
 */
export function parsePaymentHeader(header: string): { txHash: string; chainId: number } | null {
  if (!header) return null;

  const parts = header.split(":");
  if (parts.length === 1) {
    // Just txHash, default to Cronos zkEVM
    return { txHash: parts[0], chainId: 240 };
  } else if (parts.length === 2) {
    return { txHash: parts[0], chainId: parseInt(parts[1], 10) };
  }

  return null;
}
