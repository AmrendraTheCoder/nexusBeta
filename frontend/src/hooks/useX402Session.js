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
 */
export function useX402Session() {
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [sessionBalance, setSessionBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState(null);

  // Get private key from environment or prompt user
  // Note: In production, this should be handled more securely
  const getPrivateKey = useCallback(() => {
    // Try environment variable first
    const envKey = import.meta.env.VITE_EVM_PRIVATE_KEY;
    if (envKey) {
      return envKey;
    }

    // Try to get from localStorage (user might have stored it)
    const storedKey = localStorage.getItem("x402_private_key");
    if (storedKey) {
      return storedKey;
    }

    // Prompt user for private key (for x402 payments)
    // In production, you might want to use a more secure method
    const userKey = prompt(
      "Enter your private key for x402 payments (Base Sepolia):\n" +
      "This will be stored locally and used for workflow execution payments."
    );

    if (userKey) {
      localStorage.setItem("x402_private_key", userKey);
      return userKey;
    }

    return null;
  }, []);

  // Initialize x402 client
  const initializeClient = useCallback(async () => {
    if (isInitialized) {
      return true;
    }

    try {
      const privateKey = getPrivateKey();
      if (!privateKey) {
        throw new Error("Private key required for x402 payments");
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
          throw new Error("Failed to initialize x402 client");
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
      console.error("[x402] Balance fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);

  // Check if user has sufficient balance for workflow
  const checkBalance = useCallback(
    async (nodeCount, pricePerNode = 0.001) => {
      await refreshBalance();
      const required = nodeCount * pricePerNode;
      return sessionBalance >= required;
    },
    [sessionBalance, refreshBalance]
  );

  // Auto-authorize if balance is low
  const ensureBalance = useCallback(
    async (nodeCount, pricePerNode = 0.001) => {
      const required = nodeCount * pricePerNode;
      const hasBalance = await checkBalance(nodeCount, pricePerNode);

      if (!hasBalance) {
        // Auto-authorize default amount
        await authorize(DEFAULT_AUTH_AMOUNT);
      }
    },
    [checkBalance, authorize]
  );

  // Initialize on mount if wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      initializeClient().then((success) => {
        if (success) {
          refreshBalance();
        }
      });
    }
  }, [isConnected, address, initializeClient, refreshBalance]);

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
  };
}

