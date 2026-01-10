import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// x402 client singleton
let x402FetchClient = null;
let x402ClientInstance = null;

/**
 * Initialize x402 client with wallet signer
 * @param {string} privateKey - EVM private key (0x...)
 * @returns {Promise<Function>} - Wrapped fetch function with payment handling
 */
export async function initializeX402Client(privateKey) {
  if (!privateKey) {
    throw new Error("Private key is required for x402 client");
  }

  if (x402FetchClient) {
    return x402FetchClient;
  }

  try {
    console.log("[x402] Initializing client...");
    
    // Create signer from private key
    const signer = privateKeyToAccount(privateKey);

    // Create x402 client and register EVM scheme
    x402ClientInstance = new x402Client();
    registerExactEvmScheme(x402ClientInstance, { signer });

    // The x402Client doesn't require explicit initialization
    // The scheme registration is enough to make it functional
    console.log("[x402] Client scheme registered successfully");

    // Wrap fetch with payment handling
    x402FetchClient = wrapFetchWithPayment(fetch, x402ClientInstance);

    console.log("[x402] Client initialized successfully");
    return x402FetchClient;
  } catch (error) {
    console.error("[x402] Failed to initialize client:", error);
    throw error;
  }
}

/**
 * Get x402 client instance (for advanced usage)
 */
export function getX402Client() {
  return x402ClientInstance;
}

/**
 * Make a paid request using x402
 * Automatically handles payment if required
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchWithPayment(url, options = {}) {
  if (!x402FetchClient) {
    throw new Error("x402 client not initialized. Call initializeX402Client first.");
  }

  try {
    const response = await x402FetchClient(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    });

    // Check if payment was settled
    if (response.ok && x402ClientInstance) {
      try {
        const httpClient = new x402HTTPClient(x402ClientInstance);
        const paymentResponse = httpClient.getPaymentSettleResponse(
          (name) => response.headers.get(name)
        );
        
        if (paymentResponse) {
          console.log("[x402] Payment settled:", paymentResponse);
        }
      } catch (error) {
        // Payment header parsing failed, but request succeeded - that's okay
        console.debug("[x402] Could not parse payment response:", error);
      }
    }

    return response;
  } catch (error) {
    if (error.message?.includes("No scheme registered")) {
      throw new Error("Network not supported - x402 client not properly initialized");
    } else if (error.message?.includes("Payment already attempted")) {
      throw new Error("Payment failed on retry");
    }
    throw error;
  }
}

/**
 * Authorize session balance for workflow execution
 * @param {string} engineUrl - Engine server URL
 * @param {string} walletAddress - User wallet address
 * @param {number} amount - Amount to authorize (default: 1.0)
 * @returns {Promise<Object>} - Authorization result
 */
export async function authorizeSessionBalance(engineUrl, walletAddress, amount = 1.0) {
  const url = `${engineUrl}/x402/authorize`;
  
  try {
    const response = await fetchWithPayment(url, {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
        amount,
      }),
    });

    if (response.status === 402) {
      // Payment required - retry with payment
      const retryResponse = await fetchWithPayment(url, {
        method: "POST",
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || "Authorization failed");
      }

      return await retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Authorization failed");
    }

    return await response.json();
  } catch (error) {
    console.error("[x402] Authorization error:", error);
    throw error;
  }
}

/**
 * Get current session balance
 * @param {string} engineUrl - Engine server URL
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<Object>} - Balance information
 */
export async function getSessionBalance(engineUrl, walletAddress) {
  const url = `${engineUrl}/x402/balance?wallet=${encodeURIComponent(walletAddress)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Failed to fetch session balance");
    }

    return await response.json();
  } catch (error) {
    console.error("[x402] Balance fetch error:", error);
    throw error;
  }
}

