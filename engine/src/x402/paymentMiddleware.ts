import type { Request, Response, NextFunction } from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import type { PaymentPayload, PaymentRequirements, Network } from "@x402/core/types";

// Session balance tracking: wallet address -> remaining balance (in USD)
const sessionBalances: Map<string, number> = new Map();

// Configuration
const PAYMENT_CONFIG = {
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
  payToAddress: process.env.X402_PAY_TO_ADDRESS || "0x0000000000000000000000000000000000000000", // Should be set in env
  pricePerNode: 0.001, // $0.001 per node
  defaultNetwork: "eip155:240", // Cronos zkEVM Testnet (default)
  maxSessionBalance: 1.0, // Maximum $1.00 per session
};

// Chain ID to EIP-155 network mapping
const CHAIN_ID_TO_NETWORK: Record<number, string> = {
  240: "eip155:240",     // Cronos zkEVM Testnet
  84532: "eip155:84532", // Base Sepolia
  80002: "eip155:80002", // Polygon Amoy
  11155111: "eip155:11155111", // Ethereum Sepolia
};

// Initialize x402 server
const facilitatorClient = new HTTPFacilitatorClient({
  url: PAYMENT_CONFIG.facilitatorUrl,
});

const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

// Track initialization state
let isX402Initialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize x402 server (must be called before use)
 */
export async function initializeX402Server(): Promise<void> {
  if (isX402Initialized) {
    return; // Already initialized
  }

  if (initializationPromise) {
    return initializationPromise; // Wait for in-progress initialization
  }

  initializationPromise = (async () => {
    try {
      console.log('[x402] Initializing x402 server and fetching facilitator support...');
      console.log(`[x402] Facilitator URL: ${PAYMENT_CONFIG.facilitatorUrl}`);
      await x402Server.initialize();
      isX402Initialized = true;
      console.log('[x402] ✅ x402 server initialized successfully');
      
      // Log supported networks/schemes for debugging
      try {
        const schemes = (x402Server as any)._schemes;
        if (schemes) {
          console.log('[x402] Registered schemes:', Object.keys(schemes));
        }
      } catch (e) {
        // Ignore - just for debugging
      }
    } catch (error) {
      console.error('[x402] ❌ Failed to initialize x402 server:', error);
      // Mark as initialized anyway to prevent repeated attempts
      isX402Initialized = true;
      console.warn('[x402] ⚠️ Will operate in development mode (no payment verification)');
    }
  })();

  return initializationPromise;
}

/**
 * Convert chain ID to EIP-155 network format
 */
function getNetworkFromChainId(chainId: number): string {
  return CHAIN_ID_TO_NETWORK[chainId] || PAYMENT_CONFIG.defaultNetwork;
}

/**
 * Get session balance for a wallet address
 */
export function getSessionBalance(walletAddress: string): number {
  return sessionBalances.get(walletAddress.toLowerCase()) || 0;
}

/**
 * Deduct from session balance
 */
export function deductSessionBalance(walletAddress: string, amount: number): boolean {
  const address = walletAddress.toLowerCase();
  const currentBalance = sessionBalances.get(address) || 0;
  
  if (currentBalance < amount) {
    return false; // Insufficient balance
  }
  
  sessionBalances.set(address, currentBalance - amount);
  return true;
}

/**
 * Add to session balance (for authorization)
 */
export function addSessionBalance(walletAddress: string, amount: number): void {
  const address = walletAddress.toLowerCase();
  const currentBalance = sessionBalances.get(address) || 0;
  const newBalance = Math.min(currentBalance + amount, PAYMENT_CONFIG.maxSessionBalance);
  sessionBalances.set(address, newBalance);
}

/**
 * Calculate payment required for workflow execution
 * Based on number of nodes in the workflow
 */
export function calculateWorkflowCost(nodeCount: number): number {
  return nodeCount * PAYMENT_CONFIG.pricePerNode;
}

/**
 * x402 Payment middleware for workflow execution
 * Checks if user has sufficient session balance or requires payment
 */
export async function x402PaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure x402 server is initialized
    if (!isX402Initialized) {
      console.log('[x402] Middleware: x402 not initialized yet, initializing now...');
      try {
        await initializeX402Server();
      } catch (error) {
        console.error('[x402] Failed to initialize, skipping payment check:', error);
        return next(); // Skip payment check if initialization fails
      }
    }

    const { json_workflow } = req.body;
    
    if (!json_workflow) {
      return next();
    }

    const walletAddress = json_workflow.walletaddr;
    if (!walletAddress) {
      return next(); // No wallet address, skip payment check
    }

    // Count nodes in workflow
    const nodeCount = Object.keys(json_workflow.nodes || {}).length;
    if (nodeCount === 0) {
      return next(); // No nodes to charge for
    }

    // Get the chain ID from the workflow nodes (use first nexusPay node)
    let chainId = 240; // Default to Cronos zkEVM
    const nodes = json_workflow.nodes || {};
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.node_data?.chainId) {
        chainId = node.node_data.chainId;
        break;
      }
    }

    const network = getNetworkFromChainId(chainId);
    const requiredPayment = calculateWorkflowCost(nodeCount);
    const sessionBalance = getSessionBalance(walletAddress);

    console.log(`[x402] Wallet: ${walletAddress}`);
    console.log(`[x402] Chain: ${chainId} (${network})`);
    console.log(`[x402] Nodes: ${nodeCount}, Required: $${requiredPayment.toFixed(4)}`);
    console.log(`[x402] Session Balance: $${sessionBalance.toFixed(4)}`);

    // Check if user has sufficient session balance
    if (sessionBalance >= requiredPayment) {
      // Deduct from session balance
      deductSessionBalance(walletAddress, requiredPayment);
      console.log(`[x402] ✅ Using session balance. Remaining: $${getSessionBalance(walletAddress).toFixed(4)}`);
      return next();
    }

    // User needs to authorize payment
    // Use x402 to request payment
    const resourceInfo = {
      url: req.url || "/workflow",
      description: `Workflow execution (${nodeCount} nodes @ $${PAYMENT_CONFIG.pricePerNode} each)`,
      mimeType: "application/json",
    };

    // Convert price to AssetAmount format (USDC on the workflow's chain)
    const paymentRequirements: PaymentRequirements = {
      scheme: "exact",
      network: network as Network,
      asset: "USDC", // USDC on the workflow's chain
      amount: requiredPayment.toFixed(6), // Amount in USDC
      payTo: PAYMENT_CONFIG.payToAddress,
      maxTimeoutSeconds: 300, // 5 minutes
      extra: {},
    };

    const resourceConfig = {
      scheme: "exact",
      payTo: PAYMENT_CONFIG.payToAddress,
      price: requiredPayment,
      network: network as Network,
    };

    // Extract payment payload from headers if present
    const paymentHeader = req.headers["payment"] as string;
    let paymentPayload: PaymentPayload | null = null;
    
    if (paymentHeader) {
      try {
        paymentPayload = JSON.parse(paymentHeader) as PaymentPayload;
      } catch (error) {
        console.error(`[x402] Failed to parse payment payload:`, error);
      }
    }

    // Process payment request using x402 server
    try {
      const result = await x402Server.processPaymentRequest(
        paymentPayload,
        resourceConfig,
        resourceInfo
      );

      if (result.success && result.settlementResult) {
        // Payment verified and settled - add to session balance (up to max)
        const paymentAmount = Math.min(requiredPayment, PAYMENT_CONFIG.maxSessionBalance);
        addSessionBalance(walletAddress, paymentAmount);
        
        // Deduct the required amount
        deductSessionBalance(walletAddress, requiredPayment);
        
        console.log(`[x402] ✅ Payment verified and settled. Session balance updated.`);
        return next();
      } else if (result.requiresPayment) {
        // Payment required - return 402 with payment instructions
        const paymentRequired = result.requiresPayment;
        
        res.status(402);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Payment-Required", JSON.stringify(paymentRequired));
        
        res.json({
          error: "Payment required",
          message: `Workflow execution requires $${requiredPayment.toFixed(4)} (${nodeCount} nodes @ $${PAYMENT_CONFIG.pricePerNode} each)`,
          ...paymentRequired,
          sessionBalance: sessionBalance,
          requiredPayment: requiredPayment,
        });
        return;
      } else {
        console.log(`[x402] ❌ Payment processing failed:`, result.error);
        res.status(402).json({
          error: result.error || "Payment verification failed",
        });
        return;
      }
    } catch (error) {
      console.error(`[x402] Payment processing error:`, error);
      
      // Check if this is a "network not supported" error or facilitator error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('does not support') || 
        errorMessage.includes('No scheme registered') ||
        errorMessage.includes('not found for API version') ||
        errorMessage.includes('is not supported')
      ) {
        console.warn(`[x402] ⚠️  Payment method not supported for ${network}. Allowing workflow execution in development mode.`);
        return next(); // Allow execution to proceed
      }
      
      // On other errors, create a basic payment required response
      const paymentRequired = x402Server.createPaymentRequiredResponse(
        [paymentRequirements],
        resourceInfo,
        errorMessage
      );
      
      res.status(402);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Payment-Required", JSON.stringify(paymentRequired));
      res.json({
        error: "Payment processing error",
        ...paymentRequired,
      });
      return;
    }
  } catch (error) {
    console.error(`[x402] Middleware error:`, error);
    next(); // Continue on error (don't block workflow execution)
  }
}

/**
 * Endpoint to authorize session balance
 */
export async function authorizeSessionBalance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Ensure x402 server is initialized
    if (!isX402Initialized) {
      try {
        await initializeX402Server();
      } catch (error) {
        console.error('[x402] Failed to initialize:', error);
        res.status(500).json({ error: 'x402 server initialization failed' });
        return;
      }
    }

    const { walletAddress, amount, chainId } = req.body;
    
    if (!walletAddress) {
      res.status(400).json({ error: "Wallet address required" });
      return;
    }

    // Get network from chainId or use default
    const workflowChainId = chainId || 240;
    const network = getNetworkFromChainId(workflowChainId);

    const authAmount = amount || PAYMENT_CONFIG.maxSessionBalance;
    const resourceInfo = {
      url: req.url || "/x402/authorize",
      description: `Authorize session balance (up to $${authAmount.toFixed(4)})`,
      mimeType: "application/json",
    };

    const paymentRequirements: PaymentRequirements = {
      scheme: "exact",
      network: network as Network,
      asset: "USDC",
      amount: authAmount.toFixed(6),
      payTo: PAYMENT_CONFIG.payToAddress,
      maxTimeoutSeconds: 300,
      extra: {},
    };

    const resourceConfig = {
      scheme: "exact",
      payTo: PAYMENT_CONFIG.payToAddress,
      price: authAmount,
      network: network as Network,
    };

    // Extract payment payload from headers if present
    const paymentHeader = req.headers["payment"] as string;
    let paymentPayload: PaymentPayload | null = null;
    
    if (paymentHeader) {
      try {
        paymentPayload = JSON.parse(paymentHeader) as PaymentPayload;
      } catch (error) {
        console.error(`[x402] Failed to parse payment payload:`, error);
      }
    }

    // Process payment request
    try {
      const result = await x402Server.processPaymentRequest(
        paymentPayload,
        resourceConfig,
        resourceInfo
      );

      if (result.success && result.settlementResult) {
        // Payment verified and settled - add to session balance
        addSessionBalance(walletAddress, authAmount);
        const newBalance = getSessionBalance(walletAddress);
        
        res.json({
          success: true,
          message: `Session balance authorized. New balance: $${newBalance.toFixed(4)}`,
          balance: newBalance,
        });
        return;
      } else if (result.requiresPayment) {
        // Payment required
        const paymentRequired = result.requiresPayment;
        
        res.status(402);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Payment-Required", JSON.stringify(paymentRequired));
        res.json({
          error: "Payment required",
          message: `Authorize $${authAmount.toFixed(4)} for workflow execution`,
          ...paymentRequired,
        });
        return;
      } else {
        res.status(402).json({
          error: result.error || "Payment verification failed",
        });
        return;
      }
    } catch (error) {
      console.error(`[x402] Authorization error:`, error);
      
      // Check if this is a "network not supported" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('does not support') || 
        errorMessage.includes('No scheme registered') ||
        errorMessage.includes('not found for API version') ||
        errorMessage.includes('is not supported')
      ) {
        console.warn(`[x402] ⚠️  Payment method not supported for ${network}. Returning error.`);
        res.status(503).json({
          error: "Payment system not available",
          message: `Payment method not supported on ${network}. Please use a supported network.`,
          network,
        });
        return;
      }
      
      const paymentRequired = x402Server.createPaymentRequiredResponse(
        [paymentRequirements],
        resourceInfo,
        error instanceof Error ? error.message : "Payment processing error"
      );
      
      res.status(402);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Payment-Required", JSON.stringify(paymentRequired));
      res.json({
        error: "Payment processing error",
        ...paymentRequired,
      });
      return;
    }
  } catch (error) {
    console.error(`[x402] Authorization error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get current session balance
 */
export function getSessionBalanceEndpoint(req: Request, res: Response): void {
  const walletAddress = req.query.wallet as string;
  
  if (!walletAddress) {
    res.status(400).json({ error: "Wallet address required" });
    return;
  }

  const balance = getSessionBalance(walletAddress);
  res.json({
    walletAddress,
    balance,
    maxBalance: PAYMENT_CONFIG.maxSessionBalance,
    pricePerNode: PAYMENT_CONFIG.pricePerNode,
  });
}

