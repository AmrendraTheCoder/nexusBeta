import React, { useState, useEffect } from "react";
import {
    X, Key, Clock, Shield, Zap, Plus, Trash2, AlertTriangle,
    Check, Loader, RefreshCw, Lock, Unlock, Settings, ExternalLink
} from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, formatEther, keccak256, toHex } from "viem";
import { ethers } from "ethers";
import confetti from "canvas-confetti";
import { getContracts, getExplorerBaseUrl } from "../config/contracts";
import { sessionKeyManagerAbi } from "../abis/SessionKeyManager";

/**
 * SessionKeyPanel Component
 * Manages session keys for automated workflow execution
 * Connects to SessionKeyManager smart contract on Cronos zkEVM
 */
export default function SessionKeyPanel({ isOpen, onClose }) {
    const { address, isConnected, chain } = useAccount();
    const [sessionKeys, setSessionKeys] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newKeyConfig, setNewKeyConfig] = useState({
        duration: 24, // hours
        maxValue: "0.1", // CRO
        permissions: ["swap", "transfer", "deposit"]
    });
    const [createdKeyAddress, setCreatedKeyAddress] = useState(null);
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);

    // Get contract addresses for current chain (default to Cronos zkEVM)
    // Use 240 if chain is undefined or if we're not connected yet
    const chainId = (isConnected && chain?.id) ? chain.id : 240;
    const contracts = getContracts(chainId);
    const sessionKeyManagerAddress = contracts?.sessionKeyManager;
    const explorerUrl = getExplorerBaseUrl(chainId);
    
    // Check if user is on wrong chain
    const isWrongChain = isConnected && chain?.id && chain.id !== 240;

    // Debug: Log chain info
    useEffect(() => {
        if (isConnected && isOpen && isWrongChain) {
            console.warn(`[SessionKeyPanel] ⚠️ Wrong network! Connected to ${chain?.name} (${chain?.id}). Please switch to Cronos zkEVM Testnet (240)`);
        } else if (isConnected && isOpen) {
            console.log(`[SessionKeyPanel] ✅ Connected to chain:`, { chainId, chainName: chain?.name, address });
        }
    }, [isConnected, chainId, chain, address, isOpen, isWrongChain]);

    // Fetch session keys from contract
    const { data: sessionKeyAddresses, refetch: refetchKeys } = useReadContract({
        address: sessionKeyManagerAddress,
        abi: sessionKeyManagerAbi,
        functionName: "getSessionKeys",
        args: address ? [address] : undefined,
        chainId: chainId,
        enabled: !!address && isOpen,
    });

    // Contract write hook for creating session key
    const {
        writeContract: createKey,
        data: createTxHash,
        error: createError,
        isPending: isCreatePending,
        reset: resetCreate,
    } = useWriteContract();

    // Contract write hook for revoking session key
    const {
        writeContract: revokeKey,
        data: revokeTxHash,
        error: revokeError,
        isPending: isRevokePending,
    } = useWriteContract();

    // Wait for create transaction confirmation
    const {
        isLoading: isCreateConfirming,
        isSuccess: isCreateConfirmed,
    } = useWaitForTransactionReceipt({
        hash: createTxHash,
        chainId: chainId,
    });

    // Wait for revoke transaction confirmation
    const {
        isLoading: isRevokeConfirming,
        isSuccess: isRevokeConfirmed,
    } = useWaitForTransactionReceipt({
        hash: revokeTxHash,
        chainId: chainId,
    });

    // Fetch detailed info for each session key
    useEffect(() => {
        if (!sessionKeyAddresses || !address || !isOpen) {
            setSessionKeys([]);
            return;
        }

        const fetchKeyDetails = async () => {
            setIsLoadingKeys(true);
            try {
                const details = await Promise.all(
                    sessionKeyAddresses.map(async (keyAddr) => {
                        try {
                            // Use a simple provider to call getSessionKeyDetails
                            const provider = new ethers.JsonRpcProvider(contracts.rpc);
                            const contract = new ethers.Contract(
                                sessionKeyManagerAddress,
                                sessionKeyManagerAbi,
                                provider
                            );

                            const details = await contract.getSessionKeyDetails(keyAddr);
                            
                            return {
                                address: keyAddr,
                                owner: details[0],
                                validAfter: Number(details[1]),
                                validUntil: Number(details[2]),
                                maxValue: details[3].toString(),
                                spentValue: details[4].toString(),
                                active: details[5],
                            };
                        } catch (err) {
                            console.error(`Failed to fetch details for key ${keyAddr}:`, err);
                            return null;
                        }
                    })
                );

                setSessionKeys(details.filter((d) => d !== null));
            } catch (error) {
                console.error("[SessionKeyPanel] Error fetching key details:", error);
            } finally {
                setIsLoadingKeys(false);
            }
        };

        fetchKeyDetails();
    }, [sessionKeyAddresses, address, sessionKeyManagerAddress, contracts, isOpen]);

    // Handle successful key creation
    useEffect(() => {
        if (isCreateConfirmed && createdKeyAddress) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#f97316", "#fb923c", "#fdba74"],
            });
            
            // Refresh keys list
            refetchKeys();
            
            // Reset form after 2 seconds
            setTimeout(() => {
                setShowCreateForm(false);
                setCreatedKeyAddress(null);
                resetCreate();
            }, 2000);
        }
    }, [isCreateConfirmed, createdKeyAddress, refetchKeys, resetCreate]);

    // Handle successful key revocation
    useEffect(() => {
        if (isRevokeConfirmed) {
            refetchKeys();
        }
    }, [isRevokeConfirmed, refetchKeys]);

    // Convert permission names to function selectors
    const getPermissionSelectors = (permissions) => {
        const selectorMap = {
            swap: keccak256(toHex("swap(address,address,uint256,uint256)")).slice(0, 10),
            transfer: keccak256(toHex("transfer(address,uint256)")).slice(0, 10),
            deposit: keccak256(toHex("deposit()")).slice(0, 10),
            withdraw: keccak256(toHex("withdraw(uint256)")).slice(0, 10),
            approve: keccak256(toHex("approve(address,uint256)")).slice(0, 10),
        };

        return permissions.map((perm) => selectorMap[perm] || "0x00000000");
    };

    // Handle creating a new session key
    const handleCreateSessionKey = async () => {
        if (!address || !isConnected) {
            alert("Please connect your wallet first");
            return;
        }

        if (parseFloat(newKeyConfig.maxValue) <= 0) {
            alert("Max value must be greater than 0");
            return;
        }

        setIsCreating(true);

        try {
            // Generate a random session key address (in production, this would be stored securely)
            const randomWallet = ethers.Wallet.createRandom();
            const sessionKeyAddress = randomWallet.address;
            setCreatedKeyAddress(sessionKeyAddress);

            console.log("[SessionKeyPanel] Creating session key:", {
                address: sessionKeyAddress,
                duration: newKeyConfig.duration,
                maxValue: newKeyConfig.maxValue,
                permissions: newKeyConfig.permissions,
            });

            // Calculate validUntil timestamp
            const validUntil = Math.floor(Date.now() / 1000) + (newKeyConfig.duration * 3600);
            
            // Parse max value to wei
            const maxValueWei = parseEther(newKeyConfig.maxValue);
            
            // Get function selectors
            const allowedFunctions = getPermissionSelectors(newKeyConfig.permissions);

            // Call createSessionKey on contract
            createKey({
                address: sessionKeyManagerAddress,
                abi: sessionKeyManagerAbi,
                functionName: "createSessionKey",
                args: [sessionKeyAddress, BigInt(validUntil), maxValueWei, allowedFunctions],
                chainId: chainId,
            });
        } catch (error) {
            console.error("[SessionKeyPanel] Create session key error:", error);
            alert("Failed to create session key: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    // Handle revoking a session key
    const handleRevokeKey = async (keyAddress) => {
        if (!window.confirm(`Are you sure you want to revoke this session key?\n\n${keyAddress}`)) {
            return;
        }

        try {
            revokeKey({
                address: sessionKeyManagerAddress,
                abi: sessionKeyManagerAbi,
                functionName: "revokeSessionKey",
                args: [keyAddress],
                chainId: chainId,
            });
        } catch (error) {
            console.error("[SessionKeyPanel] Revoke error:", error);
            alert("Failed to revoke session key: " + error.message);
        }
    };

    // Toggle permission
    const togglePermission = (perm) => {
        setNewKeyConfig((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter((p) => p !== perm)
                : [...prev.permissions, perm],
        }));
    };

    // Format time remaining
    const formatTimeRemaining = (validUntil) => {
        const now = Math.floor(Date.now() / 1000);
        const diff = validUntil - now;
        
        if (diff <= 0) return "Expired";

        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Handle close
    const handleClose = () => {
        setShowCreateForm(false);
        resetCreate();
        onClose();
    };

    if (!isOpen) return null;

    const isProcessing = isCreatePending || isCreateConfirming || isRevokePending || isRevokeConfirming;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Sliding Panel from Right */}
            <div className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Key className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Session Keys</h2>
                            <p className="text-amber-100 text-sm">Automated workflow permissions</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Connection Warning */}
                    {!isConnected && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-red-800 mb-1">Wallet Not Connected</h3>
                                <p className="text-sm text-red-700">
                                    Please connect your wallet to manage session keys.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* What are Session Keys */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                            <Shield size={18} />
                            What are Session Keys?
                        </h3>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            Session keys allow workflows to execute automatically without requiring
                            your signature for each transaction. Set spending limits and permissions
                            for maximum security.
                        </p>
                    </div>

                    {/* Success Message */}
                    {isCreateConfirmed && createdKeyAddress && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                            <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-green-800 mb-1">Session Key Created! 🎉</h3>
                                <p className="text-sm text-green-700 font-mono break-all">
                                    {createdKeyAddress}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Messages */}
                    {(createError || revokeError) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-red-800 mb-1">Transaction Failed</h3>
                                <p className="text-sm text-red-700">
                                    {createError?.message || revokeError?.message || "An error occurred"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Create New Key Button */}
                    {!showCreateForm && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            disabled={!isConnected || isProcessing}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                            Create New Session Key
                        </button>
                    )}

                    {/* Create Form */}
                    {showCreateForm && (
                        <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200 space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-slate-800 text-lg">New Session Key</h4>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    disabled={isProcessing}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Clock size={14} className="inline mr-1" />
                                    Duration
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { hours: 1, label: "1h" },
                                        { hours: 6, label: "6h" },
                                        { hours: 24, label: "1d" },
                                        { hours: 72, label: "3d" },
                                        { hours: 168, label: "7d" },
                                    ].map(({ hours, label }) => (
                                        <button
                                            key={hours}
                                            onClick={() => setNewKeyConfig({ ...newKeyConfig, duration: hours })}
                                            disabled={isProcessing}
                                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                                newKeyConfig.duration === hours
                                                    ? "bg-amber-500 text-white shadow-md"
                                                    : "bg-white border-2 border-slate-300 text-slate-700 hover:border-amber-400"
                                            } disabled:opacity-50`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Value */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Zap size={14} className="inline mr-1" />
                                    Max Value ({contracts?.nativeCurrency?.symbol || "CRO"})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={newKeyConfig.maxValue}
                                    onChange={(e) => setNewKeyConfig({ ...newKeyConfig, maxValue: e.target.value })}
                                    disabled={isProcessing}
                                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 text-lg font-semibold"
                                    placeholder="0.1"
                                />
                                <div className="flex gap-2 mt-2">
                                    {["0.01", "0.1", "0.5", "1.0"].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setNewKeyConfig({ ...newKeyConfig, maxValue: val })}
                                            disabled={isProcessing}
                                            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium hover:border-amber-400 disabled:opacity-50"
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Shield size={14} className="inline mr-1" />
                                    Allowed Functions
                                </label>
                                <div className="space-y-2">
                                    {["swap", "transfer", "deposit", "withdraw", "approve"].map((perm) => (
                                        <button
                                            key={perm}
                                            onClick={() => togglePermission(perm)}
                                            disabled={isProcessing}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-all ${
                                                newKeyConfig.permissions.includes(perm)
                                                    ? "bg-green-50 border-green-400 text-green-800"
                                                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                                            } disabled:opacity-50`}
                                        >
                                            <span className="font-medium capitalize">{perm}</span>
                                            {newKeyConfig.permissions.includes(perm) ? (
                                                <Check size={18} className="text-green-600" />
                                            ) : (
                                                <Lock size={18} className="text-slate-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateSessionKey}
                                disabled={isProcessing || !isConnected || newKeyConfig.permissions.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                            >
                                {isCreatePending ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        <span>Awaiting Signature...</span>
                                    </>
                                ) : isCreateConfirming ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        <span>Creating Session Key...</span>
                                    </>
                                ) : (
                                    <>
                                        <Key size={20} />
                                        <span>Create Session Key</span>
                                    </>
                                )}
                            </button>

                            {createTxHash && (
                                <div className="text-center">
                                    <a
                                        href={`${explorerUrl}/tx/${createTxHash}`}
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
                    )}

                    {/* Existing Keys */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-800 text-lg">Your Session Keys</h4>
                            <button
                                onClick={() => refetchKeys()}
                                disabled={isLoadingKeys}
                                className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
                            >
                                <RefreshCw className={isLoadingKeys ? "animate-spin" : ""} size={18} />
                            </button>
                        </div>

                        {isLoadingKeys ? (
                            <div className="text-center py-8">
                                <Loader className="animate-spin mx-auto mb-2 text-amber-500" size={32} />
                                <p className="text-sm text-slate-500">Loading session keys...</p>
                            </div>
                        ) : sessionKeys.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                                <Key size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                <p className="text-sm text-slate-500 font-medium">No session keys yet</p>
                                <p className="text-xs text-slate-400 mt-1">Create one to automate workflows</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessionKeys.map((key) => {
                                    const isExpired = key.validUntil <= Math.floor(Date.now() / 1000);
                                    const percentUsed = (Number(key.spentValue) / Number(key.maxValue)) * 100;

                                    return (
                                        <div
                                            key={key.address}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                key.active && !isExpired
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-slate-200 bg-slate-50 opacity-70"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm font-semibold text-slate-800">
                                                            {key.address.slice(0, 10)}...{key.address.slice(-8)}
                                                        </span>
                                                        {key.active && !isExpired && (
                                                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                        {isExpired && (
                                                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                                                EXPIRED
                                                            </span>
                                                        )}
                                                        {!key.active && (
                                                            <span className="px-2 py-0.5 bg-slate-500 text-white text-xs font-bold rounded-full">
                                                                REVOKED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={`${explorerUrl}/address/${key.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                                    >
                                                        <span>View on Explorer</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                                {key.active && !isExpired && (
                                                    <button
                                                        onClick={() => handleRevokeKey(key.address)}
                                                        disabled={isRevokePending || isRevokeConfirming}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Revoke Session Key"
                                                    >
                                                        {isRevokePending || isRevokeConfirming ? (
                                                            <Loader className="animate-spin" size={16} />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Expires:
                                                    </span>
                                                    <span className={`font-semibold ${isExpired ? "text-red-600" : "text-slate-800"}`}>
                                                        {formatTimeRemaining(key.validUntil)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <Zap size={12} />
                                                            Spending:
                                                        </span>
                                                        <span className="font-semibold text-slate-800">
                                                            {parseFloat(formatEther(BigInt(key.spentValue))).toFixed(4)} /{" "}
                                                            {parseFloat(formatEther(BigInt(key.maxValue))).toFixed(4)}{" "}
                                                            {contracts?.nativeCurrency?.symbol || "CRO"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${
                                                                percentUsed > 80 ? "bg-red-500" : percentUsed > 50 ? "bg-amber-500" : "bg-green-500"
                                                            }`}
                                                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                                <span className="text-slate-500">SessionKeyManager:</span>
                                <a
                                    href={`${explorerUrl}/address/${sessionKeyManagerAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <span>{sessionKeyManagerAddress?.slice(0, 6)}...{sessionKeyManagerAddress?.slice(-4)}</span>
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
