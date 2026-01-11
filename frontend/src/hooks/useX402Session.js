import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  initializeX402Client,
  authorizeSessionBalance,
  getSessionBalance,
  fetchWithPayment,
} from "../services/x402Client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const DEFAULT_AUTH_AMOUNT = 1.0; // $1.00 default authorization

/**
 * Hook for managing x402 payment sessions
 * Handles session balance authorization and payment for workflow execution
 * 
 * NOTE: This hook no longer prompts for private key automatically.
 * The private key should be set via environment variable VITE_EVM_PRIVATE_KEY
 * or the user can manually initialize via the Settings panel.
 */
export function useX402Session() {
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [sessionBalance, setSessionBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState(null);

  // Get private key from environment or localStorage (NO PROMPT)
  const getPrivateKey = useCallback(() => {
    // Try environment variable first
    const envKey = import.meta.env.VITE_EVM_PRIVATE_KEY;
    if (envKey) {
      return envKey;
    }

    // Try to get from localStorage (user might have stored it via Settings)
    const storedKey = localStorage.getItem("x402_private_key");
    if (storedKey) {
      return storedKey;
    }

    // Don't prompt - return null and let the caller handle it
    return null;
  }, []);

  // Check if private key is available (without prompting)
  const hasPrivateKey = useCallback(() => {
    return !!getPrivateKey();
  }, [getPrivateKey]);

  // Set private key manually (from Settings panel)
  const setPrivateKey = useCallback((key) => {
    if (key) {
      localStorage.setItem("x402_private_key", key);
      return true;
    }
    return false;
  }, []);

  // Clear stored private key
  const clearPrivateKey = useCallback(() => {
    localStorage.removeItem("x402_private_key");
    setIsInitialized(false);
  }, []);

  // Initialize x402 client (only if private key is available)
  const initializeClient = useCallback(async (forcePrompt = false) => {
    if (isInitialized) {
      return true;
    }

    try {
      let privateKey = getPrivateKey();
      
      // Only prompt if explicitly requested (e.g., from Settings panel)
      if (!privateKey && forcePrompt) {
        const userKey = prompt(
          "Enter your private key for x402 payments (Base Sepolia):\n" +
          "This will be stored locally and used for workflow execution payments.\n\n" +
          "⚠️ For demo purposes only. Never use a real wallet with funds!"
        );
        
        if (userKey) {
          localStorage.setItem("x402_private_key", userKey);
          privateKey = userKey;
        }
      }
      
      if (!privateKey) {
        // No private key available - this is OK, x402 features just won't work
        console.log("[x402] No private key configured - x402 payments disabled");
        return false;
      }

      await initializeX402Client(privateKey);
      setIsInitialized(true);
      setError(null);
      return true;
    } catch (err) {
      console.error("[x402] Initialization error:", err);
      setError(err.message);
      return false;
    }
  }, [isInitialized, getPrivateKey]);

  // Authorize session balance
  const authorize = useCallback(
    async (amount = DEFAULT_AUTH_AMOUNT) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!isInitialized) {
        const initialized = await initializeClient();
        if (!initialized) {
          // Don't throw - just skip x402 features
          console.warn("[x402] Cannot authorize - no private key configured");
          return null;
        }
      }

      setIsAuthorizing(true);
      setError(null);

      try {
        const result = await authorizeSessionBalance(API_URL, address, amount);
        await refreshBalance();
        setIsAuthorizing(false);
        return result;
      } catch (err) {
        setIsAuthorizing(false);
        setError(err.message);
        throw err;
      }
    },
    [address, isInitialized, initializeClient]
  );

  // Refresh session balance
  const refreshBalance = useCallback(async () => {
    if (!address) {
      return;
    }

    setIsLoadingBalance(true);
    try {
      const balanceData = await getSessionBalance(API_URL, address);
      setSessionBalance(balanceData.balance || 0);
      setError(null);
    } catch (err) {
      // Don't log error if x402 is not configured - this is expected
      if (isInitialized) {
        console.error("[x402] Balance fetch error:", err);
        setError(err.message);
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address, isInitialized]);

  // Check if user has sufficient balance for workflow
  const checkBalance = useCallback(
    async (nodeCount, pricePerNode = 0.001) => {
      if (!isInitialized) {
        return true; // Skip balance check if x402 not configured
      }
      await refreshBalance();
      const required = nodeCount * pricePerNode;
      return sessionBalance >= required;
    },
    [sessionBalance, refreshBalance, isInitialized]
  );

  // Auto-authorize if balance is low (only if x402 is configured)
  const ensureBalance = useCallback(
    async (nodeCount, pricePerNode = 0.001) => {
      if (!isInitialized) {
        return; // Skip if x402 not configured
      }
      
      const required = nodeCount * pricePerNode;
      const hasBalance = await checkBalance(nodeCount, pricePerNode);

      if (!hasBalance) {
        // Auto-authorize default amount
        await authorize(DEFAULT_AUTH_AMOUNT);
      }
    },
    [checkBalance, authorize, isInitialized]
  );

  // Initialize on mount ONLY if private key is already available (no prompt)
  useEffect(() => {
    if (isConnected && address && hasPrivateKey()) {
      initializeClient().then((success) => {
        if (success) {
          refreshBalance();
        }
      });
    }
  }, [isConnected, address, hasPrivateKey, initializeClient, refreshBalance]);

  return {
    isInitialized,
    isAuthorizing,
    sessionBalance,
    isLoadingBalance,
    error,
    authorize,
    refreshBalance,
    checkBalance,
    ensureBalance,
    initializeClient,
    hasPrivateKey,
    setPrivateKey,
    clearPrivateKey,
  };
}
