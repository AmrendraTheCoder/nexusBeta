import React, { useState, useEffect } from "react";
import {
  X, Wallet, ArrowDown, AlertCircle, CheckCircle, Loader,
  RefreshCw, ExternalLink, TrendingUp, DollarSign, Coins
} from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import confetti from "canvas-confetti";
import { getContracts, getExplorerBaseUrl } from "../config/contracts";
import { nexusTreasuryAbi } from "../abis/NexusTreasury";

/**
 * DepositPanel Component
 * Allows users to deposit native CRO tokens into NexusTreasury smart contract
 * Handles on-chain deposits and backend virtual balance updates
 */
export default function DepositPanel({ isOpen, onClose }) {
  const { address, isConnected, chain } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [virtualBalance, setVirtualBalance] = useState("0");
  const [isLoadingVirtual, setIsLoadingVirtual] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [txSuccess, setTxSuccess] = useState(false);

  // Get contract addresses for current chain (default to Cronos zkEVM)
  // Use 240 if chain is undefined or if we're not connected yet
  const chainId = (isConnected && chain?.id) ? chain.id : 240;
  const contracts = getContracts(chainId);
  const treasuryAddress = contracts?.treasury;
  const explorerUrl = getExplorerBaseUrl(chainId);

  // Check if user is on wrong chain
  const isWrongChain = isConnected && chain?.id && chain.id !== 240;

  // Debug: Log chain info
  useEffect(() => {
    if (isConnected && isWrongChain) {
      console.warn(`[DepositPanel] ⚠️ Wrong network! Connected to ${chain?.name} (${chain?.id}). Please switch to Cronos zkEVM Testnet (240)`);
    } else if (isConnected) {
      console.log(`[DepositPanel] ✅ Connected to chain:`, { chainId, chainName: chain?.name, address });
    }
  }, [isConnected, chainId, chain, address, isWrongChain]);

  // Get user's native token balance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: address,
    chainId: chainId,
  });

  // Read minimum deposit requirement from contract
  const { data: minDeposit } = useReadContract({
    address: treasuryAddress,
    abi: nexusTreasuryAbi,
    functionName: "MIN_DEPOSIT",
    chainId: chainId,
  });

  // Read user's on-chain deposit balance from Treasury contract
  const { data: onChainBalance, refetch: refetchOnChain, isLoading: isLoadingOnChain } = useReadContract({
    address: treasuryAddress,
    abi: nexusTreasuryAbi,
    functionName: "getBalance",
    args: address ? [address] : undefined,
    chainId: chainId,
    enabled: !!address,
  });

  // Contract write hook for deposit
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: chainId,
  });

  // Debug: Log transaction hash when it changes
  useEffect(() => {
    if (txHash) {
      console.log("[DepositPanel] 📝 Transaction submitted:", txHash);
    }
  }, [txHash]);

  // Debug: Log confirmation status
  useEffect(() => {
    if (isConfirming) {
      console.log("[DepositPanel] ⏳ Waiting for confirmation...");
    }
    if (isConfirmed) {
      console.log("[DepositPanel] ✅ Transaction confirmed!");
    }
  }, [isConfirming, isConfirmed]);

  // Fetch virtual balance from backend
  const fetchVirtualBalance = async () => {
    if (!address) return;

    setIsLoadingVirtual(true);
    setBackendError(null);

    try {
      const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(
        `${backendUrl}/api/nexus/balance/${address}/${chainId}`
      );

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setVirtualBalance(data.virtualBalance || "0");
      } else {
        throw new Error(data.message || "Failed to fetch virtual balance");
      }
    } catch (error) {
      console.error("[DepositPanel] Virtual balance fetch error:", error);
      setBackendError(error.message);
      setVirtualBalance("0");
    } finally {
      setIsLoadingVirtual(false);
    }
  };

  // Fetch virtual balance on mount and when address/chain changes
  useEffect(() => {
    fetchVirtualBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId]);

  // Handle successful deposit confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      handleDepositConfirmed(txHash); // Pass txHash to the function
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, txHash]);

  // Notify backend of successful deposit
  const handleDepositConfirmed = async (transactionHash) => {
    if (!transactionHash) {
      console.error("[DepositPanel] No transaction hash provided!");
      return;
    }

    console.log("[DepositPanel] ✅ Deposit confirmed, notifying backend:", transactionHash);

    try {
      const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendUrl}/api/nexus/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          chainId: chainId,
          amount: parseEther(depositAmount).toString(),
          txHash: transactionHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("[DepositPanel] ✅ Backend updated successfully");

        // Trigger confetti celebration
        triggerConfetti();

        // Refresh balances
        await Promise.all([
          fetchVirtualBalance(),
          refetchOnChain(),
        ]);

        // Show success state
        setTxSuccess(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setDepositAmount("");
          resetWrite();
          setTxSuccess(false);
        }, 3000);
      } else {
        console.warn("[DepositPanel] ⚠️ Backend update failed:", data.message);
        setBackendError("Deposit confirmed on-chain but backend update failed. Please refresh.");
      }
    } catch (error) {
      console.error("[DepositPanel] ❌ Backend notification error:", error);
      setBackendError("Deposit confirmed on-chain but backend notification failed.");
    }
  };

  // Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#f97316", "#fb923c", "#fdba74", "#fbbf24"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#f97316", "#fb923c", "#fdba74", "#fbbf24"],
      });
    }, 250);
  };

  // Handle deposit button click
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    const amountWei = parseEther(depositAmount);
    const minDepositWei = minDeposit || parseEther("0.01");

    // Validate minimum deposit
    if (amountWei < minDepositWei) {
      alert(`Minimum deposit is ${formatEther(minDepositWei)} ${contracts?.nativeCurrency?.symbol || "CRO"}`);
      return;
    }

    // Validate sufficient balance
    if (nativeBalance && amountWei > nativeBalance.value) {
      alert("Insufficient balance");
      return;
    }

    // Force strict chain check
    if (chain?.id !== 240) {
      alert("Please switch to Cronos zkEVM Testnet (Chain ID 240) to continue.");
      try {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xf0' }],
        });
      } catch (e) {
        console.error("Auto-switch failed:", e);
      }
      return;
    }

    try {
      // Call deposit function with value
      writeContract({
        address: treasuryAddress,
        abi: nexusTreasuryAbi,
        functionName: "deposit",
        value: amountWei,
        chainId: chainId,
      });
    } catch (error) {
      console.error("[DepositPanel] Deposit error:", error);
    }
  };

  // Reset errors when closing
  const handleClose = () => {
    resetWrite();
    setBackendError(null);
    setTxSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  // Determine current status
  const isProcessing = isWritePending || isConfirming;
  const hasError = writeError || confirmError || backendError;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Sliding Panel from Right */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">

        {/* Wrong Chain Warning Banner */}
        {isWrongChain && (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 flex items-start gap-3 flex-shrink-0 border-b border-yellow-600">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm mb-1">⚠️ Wrong Network</h4>
              <p className="text-white/90 text-xs mb-2">
                You're on <strong>{chain?.name}</strong>. Switch to <strong>Cronos zkEVM Testnet</strong> to deposit.
              </p>
              <button
                onClick={async () => {
                  try {
                    // First try to switch
                    await window.ethereum?.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: '0xf0' }], // 240 in hex
                    });
                  } catch (switchError) {
                    // If chain doesn't exist, add it first
                    if (switchError.code === 4902) {
                      try {
                        await window.ethereum?.request({
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0xf0', // 240 in hex
                            chainName: 'Cronos zkEVM Testnet',
                            nativeCurrency: {
                              name: 'zkTCRO',
                              symbol: 'zkTCRO',
                              decimals: 18,
                            },
                            rpcUrls: ['https://testnet.zkevm.cronos.org'],
                            blockExplorerUrls: ['https://explorer.zkevm.cronos.org/testnet'],
                          }],
                        });
                      } catch (addError) {
                        console.error('Failed to add chain:', addError);
                      }
                    } else {
                      console.error('Failed to switch chain:', switchError);
                    }
                  }
                }}
                className="px-3 py-1 bg-white hover:bg-gray-100 text-amber-600 font-medium text-xs rounded-lg transition-colors shadow-sm"
              >
                Switch Network
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex justify-between items-center flex-shrink-0">     <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
            <p className="text-amber-100 text-sm">Add {contracts?.nativeCurrency?.symbol || "CRO"} to your Nexus Treasury</p>
          </div>
        </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Connection Warning */}
          {!isConnected && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Wallet Not Connected</h3>
                <p className="text-sm text-red-700">
                  Please connect your wallet to deposit funds.
                </p>
              </div>
            </div>
          )}

          {/* Wrong Network Warning - More Prominent */}
          {isConnected && chain?.id && chain.id !== 240 && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1 text-lg">⚠️ Wrong Network Detected</h3>
                  <p className="text-sm text-amber-800 mb-2">
                    You're connected to <strong>{chain?.name || `Chain ${chain?.id}`}</strong> (ID: {chain?.id}).
                  </p>
                  <p className="text-sm text-amber-800">
                    Please switch to <strong>Cronos zkEVM Testnet</strong> (ID: 240) to deposit funds.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await window.ethereum?.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: '0xf0' }],
                    });
                  } catch (switchError) {
                    if (switchError.code === 4902) {
                      try {
                        await window.ethereum?.request({
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0xf0',
                            chainName: 'Cronos zkEVM Testnet',
                            nativeCurrency: {
                              name: 'zkTCRO',
                              symbol: 'zkTCRO',
                              decimals: 18,
                            },
                            rpcUrls: ['https://testnet.zkevm.cronos.org'],
                            blockExplorerUrls: ['https://explorer.zkevm.cronos.org/testnet'],
                          }],
                        });
                      } catch (addError) {
                        console.error('Failed to add chain:', addError);
                        alert('Failed to add network. Please add Cronos zkEVM Testnet manually in your wallet.');
                      }
                    } else {
                      console.error('Failed to switch chain:', switchError);
                    }
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                🔄 Switch to Cronos zkEVM Testnet
              </button>
            </div>
          )}

          {/* Success Message */}
          {txSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Deposit Successful! 🎉</h3>
                <p className="text-sm text-green-700">
                  Your funds have been deposited and your virtual balance has been updated.
                </p>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {hasError && !txSuccess && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Transaction Failed</h3>
                <p className="text-sm text-red-700">
                  {writeError?.message || confirmError?.message || backendError || "An error occurred"}
                </p>
              </div>
            </div>
          )}

          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="text-blue-600" size={18} />
                <h3 className="text-sm font-semibold text-blue-900">Wallet Balance</h3>
              </div>
              {isLoadingNative ? (
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin text-blue-400" size={16} />
                  <span className="text-blue-400 text-sm">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-900">
                  {nativeBalance ? parseFloat(formatEther(nativeBalance.value)).toFixed(4) : "0.0000"}
                  <span className="text-sm font-normal text-blue-600 ml-1">
                    {contracts?.nativeCurrency?.symbol || "CRO"}
                  </span>
                </p>
              )}
            </div>

            {/* On-Chain Deposit */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="text-green-600" size={18} />
                <h3 className="text-sm font-semibold text-green-900">On-Chain Deposit</h3>
              </div>
              {isLoadingOnChain ? (
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin text-green-400" size={16} />
                  <span className="text-green-400 text-sm">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-900">
                  {onChainBalance ? parseFloat(formatEther(onChainBalance)).toFixed(4) : "0.0000"}
                  <span className="text-sm font-normal text-green-600 ml-1">
                    {contracts?.nativeCurrency?.symbol || "CRO"}
                  </span>
                </p>
              )}
            </div>

            {/* Virtual Balance */}
            <div className="col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-amber-600" size={18} />
                  <h3 className="text-sm font-semibold text-amber-900">Virtual Balance (Backend)</h3>
                </div>
                <button
                  onClick={fetchVirtualBalance}
                  disabled={isLoadingVirtual}
                  className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
                >
                  <RefreshCw className={isLoadingVirtual ? "animate-spin" : ""} size={16} />
                </button>
              </div>
              {isLoadingVirtual ? (
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin text-amber-400" size={16} />
                  <span className="text-amber-400 text-sm">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-amber-900">
                  {parseFloat(formatEther(BigInt(virtualBalance || "0"))).toFixed(4)}
                  <span className="text-sm font-normal text-amber-600 ml-1">
                    {contracts?.nativeCurrency?.symbol || "CRO"}
                  </span>
                </p>
              )}
              {backendError && (
                <p className="text-xs text-red-600 mt-1">⚠️ Backend unavailable</p>
              )}
            </div>
          </div>

          {/* Deposit Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Deposit Amount ({contracts?.nativeCurrency?.symbol || "CRO"})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min={minDeposit ? formatEther(minDeposit) : "0.01"}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!isConnected || isProcessing}
                  className="w-full px-4 py-3 pr-24 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                />
                <button
                  onClick={() => {
                    if (nativeBalance) {
                      // Leave a small amount for gas
                      const maxDeposit = parseFloat(formatEther(nativeBalance.value)) - 0.001;
                      setDepositAmount(Math.max(0, maxDeposit).toFixed(4));
                    }
                  }}
                  disabled={!isConnected || isProcessing || !nativeBalance}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  MAX
                </button>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>
                  Min: {minDeposit ? formatEther(minDeposit) : "0.01"} {contracts?.nativeCurrency?.symbol || "CRO"}
                </span>
                <span>
                  Available: {nativeBalance ? parseFloat(formatEther(nativeBalance.value)).toFixed(4) : "0.0000"} {contracts?.nativeCurrency?.symbol || "CRO"}
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {["0.01", "0.1", "0.5", "1.0"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount)}
                  disabled={!isConnected || isProcessing}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Main Action Button */}
            {isWrongChain ? (
              <button
                onClick={async () => {
                  try {
                    await window.ethereum?.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: '0xf0' }],
                    });
                  } catch (switchError) {
                    if (switchError.code === 4902) {
                      try {
                        await window.ethereum?.request({
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0xf0',
                            chainName: 'Cronos zkEVM Testnet',
                            nativeCurrency: { name: 'zkTCRO', symbol: 'zkTCRO', decimals: 18 },
                            rpcUrls: ['https://testnet.zkevm.cronos.org'],
                            blockExplorerUrls: ['https://explorer.zkevm.cronos.org/testnet'],
                          }],
                        });
                      } catch (e) {
                        console.error('Add chain failed:', e);
                      }
                    } else {
                      console.error('Switch chain failed:', switchError);
                    }
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 shadow-lg hover:shadow-xl transition-all"
              >
                <RefreshCw size={20} />
                <span>Switch to Cronos zkEVM Testnet</span>
              </button>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={!isConnected || isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {isWritePending ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Awaiting Signature...</span>
                  </>
                ) : isConfirming ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Confirming Transaction...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown size={20} />
                    <span>Deposit to Treasury</span>
                  </>
                )}
              </button>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <div className="text-center">
                <a
                  href={`${explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  <span>View on Explorer</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your deposit is secured in the NexusTreasury smart contract</li>
                  <li>• Virtual balance mirrors your on-chain deposit for fast transactions</li>
                  <li>• Use virtual balance to pay for AI agents and premium data</li>
                  <li>• Withdraw back to your wallet anytime (owner only)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Contract Details</h3>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="text-slate-800 font-semibold">{contracts?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chain ID:</span>
                <span className="text-slate-800 font-semibold">{chainId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Treasury:</span>
                <a
                  href={`${explorerUrl}/address/${treasuryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <span>{treasuryAddress?.slice(0, 6)}...{treasuryAddress?.slice(-4)}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
