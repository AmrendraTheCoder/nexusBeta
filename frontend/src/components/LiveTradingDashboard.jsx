import { useState, useEffect, useCallback, useRef } from "react";
import {
    X, Activity, TrendingUp, RefreshCw, AlertCircle, CheckCircle,
    BarChart2, Target, Zap, ArrowUpRight, ArrowDownRight,
    Eye, Wallet, Sparkles, Brain
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import confetti from "canvas-confetti";

/**
 * LiveTradingDashboard - Real-time trading activity monitor (White Theme Slide Panel)
 */
export default function LiveTradingDashboard({ isOpen, onClose }) {
    const { address, isConnected } = useAccount();

    const [positions, setPositions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [workflowLogs, setWorkflowLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState({
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        openPositions: 0,
        virtualBalance: "0",
    });
    const [lastUpdate, setLastUpdate] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [activeTab, setActiveTab] = useState("activity");
    const [isLoading, setIsLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [aiDecisions, setAiDecisions] = useState([]);
    const prevPnLRef = useRef(0);

    const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";
    const engineUrl = import.meta.env.VITE_ENGINE_URL || "http://localhost:8080";

    // Toast helper
    const addToast = useCallback((type, title, message) => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    // Confetti celebration for profits
    const celebrateProfit = useCallback(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }, []);

    const fetchData = useCallback(async () => {
        if (!address) {
            console.log("[LiveTrading] No wallet address, skipping fetch");
            return;
        }
        console.log("[LiveTrading] Fetching data for:", address);
        setIsLoading(true);

        try {
            console.log("[LiveTrading] Fetching from:", backendUrl);

            const [balanceRes, positionsRes, txRes, logsRes] = await Promise.allSettled([
                fetch(`${backendUrl}/api/nexus/balance/${address}/240`),
                fetch(`${backendUrl}/api/trading/positions/${address}?status=all`),
                fetch(`${backendUrl}/api/nexus/transactions/${address}?limit=20`),
                fetch(`${engineUrl}/logs/${address}`),
            ]);

            console.log("[LiveTrading] Balance response:", balanceRes.status);
            if (balanceRes.status === "fulfilled" && balanceRes.value.ok) {
                const data = await balanceRes.value.json();
                console.log("[LiveTrading] Balance data:", data);
                setStats(prev => ({ ...prev, virtualBalance: data.virtualBalance || "0" }));
            } else if (balanceRes.status === "fulfilled") {
                console.log("[LiveTrading] Balance error status:", balanceRes.value.status);
            }

            console.log("[LiveTrading] Positions response:", positionsRes.status);
            if (positionsRes.status === "fulfilled" && positionsRes.value.ok) {
                const data = await positionsRes.value.json();
                console.log("[LiveTrading] Positions data:", data);
                setPositions(data.positions || []);

                const newPnL = parseFloat(data.summary?.totalPnL || 0);

                // Check for profit increase and celebrate
                if (newPnL > prevPnLRef.current && newPnL > 0) {
                    const gain = newPnL - prevPnLRef.current;
                    if (gain > 0.5) { // Celebrate gains > 0.5%
                        celebrateProfit();
                        addToast("profit", "🎉 Profit Alert!", `+${gain.toFixed(2)}% gain on your positions!`);
                    }
                }
                prevPnLRef.current = newPnL;

                setStats(prev => ({
                    ...prev,
                    openPositions: data.summary?.openPositions || 0,
                    totalPnL: newPnL,
                }));
            }

            console.log("[LiveTrading] Transactions response:", txRes.status);
            if (txRes.status === "fulfilled" && txRes.value.ok) {
                const data = await txRes.value.json();
                console.log("[LiveTrading] Transactions data:", data);
                setTransactions(data.transactions || []);
                setStats(prev => ({
                    ...prev,
                    totalTrades: data.summary?.totalTransactions || 0,
                }));
            }

            console.log("[LiveTrading] Logs response:", logsRes.status);
            if (logsRes.status === "fulfilled" && logsRes.value.ok) {
                const data = await logsRes.value.json();
                setWorkflowLogs(data.logs || []);
                setIsRunning(data.isRunning || false);

                // Parse AI decisions from logs
                const newDecisions = [];
                (data.logs || []).forEach(log => {
                    const msg = typeof log === 'string' ? log : log.message;
                    if (msg?.includes('Decision:') || msg?.includes('Signal:') || msg?.includes('REBALANCE')) {
                        newDecisions.push({ message: msg, timestamp: log.timestamp || Date.now() });
                    }
                });
                if (newDecisions.length > 0) {
                    setAiDecisions(prev => [...prev.slice(-10), ...newDecisions]);
                }

                // Show toast for workflow status changes
                if (data.isRunning && !isRunning) {
                    addToast("execution", "Workflow Started", "AI agents are now analyzing...");
                }
            }

            setLastUpdate(new Date());
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [address, backendUrl, engineUrl]);

    useEffect(() => {
        if (!isOpen || !autoRefresh) return;
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [isOpen, autoRefresh, fetchData]);

    const timeAgo = (date) => {
        if (!date) return "";
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-[540px] z-[60] space-y-2">
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        toast={toast}
                        onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
                    />
                ))}
            </div>

            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Activity className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Live Trading</h2>
                            <p className="text-emerald-100 text-sm flex items-center gap-2">
                                {isRunning ? (
                                    <>
                                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                        Workflow Active
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 bg-white/50 rounded-full" />
                                        Idle
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`p-2 rounded-lg transition-colors ${autoRefresh ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                                }`}
                            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                        >
                            <RefreshCw size={18} className={autoRefresh ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-slate-200 bg-slate-50">
                    {!isConnected ? (
                        <div className="col-span-4 text-center py-4">
                            <Wallet size={24} className="mx-auto mb-2 text-slate-400" />
                            <p className="text-sm text-slate-500">Connect your wallet to see trading data</p>
                        </div>
                    ) : (
                        <>
                            <StatCard
                                icon={<Wallet size={16} />}
                                label="Balance"
                                value={`${parseFloat(formatEther(BigInt(stats.virtualBalance || "0"))).toFixed(3)}`}
                                unit="CRO"
                                color="blue"
                            />
                            <StatCard
                                icon={<TrendingUp size={16} />}
                                label="P&L"
                                value={`${stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(1)}%`}
                                color={stats.totalPnL >= 0 ? "green" : "red"}
                            />
                            <StatCard
                                icon={<BarChart2 size={16} />}
                                label="Trades"
                                value={stats.totalTrades}
                                color="purple"
                            />
                            <StatCard
                                icon={<Target size={16} />}
                                label="Open"
                                value={stats.openPositions}
                                color="amber"
                            />
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="px-6 py-2 border-b border-slate-200 flex gap-1 bg-white">
                    {[
                        { id: "activity", label: "Activity", icon: Zap },
                        { id: "positions", label: "Positions", icon: Target },
                        { id: "ai", label: "AI Decisions", icon: Brain },
                        { id: "logs", label: "Logs", icon: Eye },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw size={24} className="animate-spin text-emerald-500" />
                            <span className="ml-2 text-slate-500">Loading...</span>
                        </div>
                    )}

                    {!isLoading && activeTab === "activity" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
                                <span className="text-xs text-slate-500">{transactions.length} total</span>
                            </div>
                            {transactions.length === 0 ? (
                                <EmptyState icon={Activity} message={isConnected ? "No transactions yet. Make a deposit or execute a workflow." : "Connect wallet to see transactions"} />
                            ) : (
                                transactions.slice(0, 10).map((tx, i) => (
                                    <TransactionCard key={tx._id || i} tx={tx} />
                                ))
                            )}
                        </div>
                    )}

                    {!isLoading && activeTab === "positions" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800">Trading Positions</h3>
                                <span className="text-xs text-slate-500">
                                    {positions.filter(p => p.status === "open").length} open
                                </span>
                            </div>
                            {positions.length === 0 ? (
                                <EmptyState icon={Target} message="No positions yet. Start an AI trading workflow." />
                            ) : (
                                positions.map((pos, i) => (
                                    <PositionCard key={pos._id || i} position={pos} />
                                ))
                            )}
                        </div>
                    )}

                    {!isLoading && activeTab === "ai" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-500" />
                                    AI Agent Decisions
                                </h3>
                                {isRunning && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                        Analyzing
                                    </span>
                                )}
                            </div>
                            {aiDecisions.length === 0 ? (
                                <EmptyState icon={Brain} message="AI decisions will appear here during workflow execution" />
                            ) : (
                                <div className="space-y-2">
                                    {aiDecisions.slice(-10).reverse().map((decision, i) => (
                                        <AIDecisionCard key={i} decision={decision} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && activeTab === "logs" && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800">Workflow Logs</h3>
                                {isRunning && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Live
                                    </span>
                                )}
                            </div>
                            {workflowLogs.length === 0 ? (
                                <EmptyState icon={Eye} message="Run a workflow to see logs" />
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs max-h-[400px] overflow-y-auto">
                                    {workflowLogs.slice(-30).map((log, i) => (
                                        <LogEntry key={i} log={log} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="font-mono text-xs">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                        </span>
                    </div>
                    {lastUpdate && (
                        <span className="text-xs text-slate-400">
                            Updated {timeAgo(lastUpdate)}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ icon, label, value, unit, color }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-emerald-600 bg-emerald-50",
        red: "text-red-600 bg-red-50",
        purple: "text-purple-600 bg-purple-50",
        amber: "text-amber-600 bg-amber-50",
    };

    return (
        <div className="bg-white rounded-xl p-3 border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1">
                <span className={colors[color]?.split(" ")[0]}>{icon}</span>
                <span className="text-[10px] text-slate-500 uppercase">{label}</span>
            </div>
            <p className={`text-lg font-bold ${colors[color]?.split(" ")[0]}`}>
                {value}
                {unit && <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>}
            </p>
        </div>
    );
}

function EmptyState({ icon: Icon, message }) {
    return (
        <div className="text-center py-12 text-slate-400">
            <Icon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

function TransactionCard({ tx }) {
    const isDeposit = tx.type === "deposit";
    const isSuccess = tx.status === "completed";

    return (
        <div className={`p-4 rounded-xl border ${isSuccess ? "bg-white border-slate-200" : "bg-red-50 border-red-200"
            }`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isDeposit ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                    {tx.type?.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : ""}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${isDeposit ? "text-green-600" : "text-slate-800"}`}>
                    {isDeposit ? "+" : "-"}{tx.amountFormatted || parseFloat(formatEther(BigInt(tx.amount || "0"))).toFixed(4)}
                    <span className="text-sm font-normal text-slate-500 ml-1">{tx.symbol || "CRO"}</span>
                </span>
                {isSuccess ? (
                    <CheckCircle size={18} className="text-green-500" />
                ) : (
                    <AlertCircle size={18} className="text-red-500" />
                )}
            </div>
            {tx.provider && (
                <p className="text-xs text-slate-500 mt-2 truncate">
                    To: {tx.provider}
                </p>
            )}
        </div>
    );
}

function PositionCard({ position }) {
    const isOpen = position.status === "open";
    const isProfit = (position.pnlPercent || 0) >= 0;

    return (
        <div className={`p-4 rounded-xl border ${isOpen ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200"
            }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-lg">{position.symbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${position.positionType === "long"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}>
                        {position.positionType?.toUpperCase()}
                    </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${isOpen ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                    }`}>
                    {position.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <span className="text-xs text-slate-500">Entry Price</span>
                    <p className="font-semibold text-slate-800">${position.entryPrice?.toLocaleString()}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500">P&L</span>
                    <p className={`font-semibold flex items-center gap-1 ${isProfit ? "text-green-600" : "text-red-600"}`}>
                        {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isProfit ? "+" : ""}{(position.pnlPercent || 0).toFixed(2)}%
                    </p>
                </div>
                <div>
                    <span className="text-xs text-slate-500">Stop Loss</span>
                    <p className="font-medium text-red-600">${position.stopLoss?.toLocaleString()}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500">Take Profit</span>
                    <p className="font-medium text-green-600">${position.takeProfit?.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function LogEntry({ log }) {
    const colors = {
        success: "text-green-600",
        error: "text-red-600",
        warning: "text-amber-600",
        info: "text-blue-600",
    };

    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
    };

    return (
        <div className={`py-1 ${colors[log.type] || "text-slate-600"}`}>
            <span className="mr-2">{icons[log.type] || "•"}</span>
            <span className="text-slate-400 mr-2">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
            </span>
            <span>{log.message || JSON.stringify(log)}</span>
        </div>
    );
}

function AIDecisionCard({ decision }) {
    const msg = decision.message || "";

    // Determine decision type and styling
    let icon = "🤖";
    let bgColor = "bg-slate-50 border-slate-200";

    if (msg.includes("BUY") || msg.includes("BULLISH")) {
        icon = "📈";
        bgColor = "bg-green-50 border-green-200";
    } else if (msg.includes("SELL") || msg.includes("BEARISH")) {
        icon = "📉";
        bgColor = "bg-red-50 border-red-200";
    } else if (msg.includes("REBALANCE")) {
        icon = "SYNC";
        bgColor = "bg-blue-50 border-blue-200";
    } else if (msg.includes("HOLD") || msg.includes("WAIT")) {
        icon = "⏸️";
        bgColor = "bg-amber-50 border-amber-200";
    } else if (msg.includes("APPROVED")) {
        icon = "✅";
        bgColor = "bg-emerald-50 border-emerald-200";
    } else if (msg.includes("REJECTED")) {
        icon = "❌";
        bgColor = "bg-red-50 border-red-200";
    }

    return (
        <div className={`p-3 rounded-xl border ${bgColor}`}>
            <div className="flex items-start gap-3">
                <span className="text-xl">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium line-clamp-2">{msg}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {decision.timestamp ? new Date(decision.timestamp).toLocaleTimeString() : "Just now"}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Toast component for notifications
function ToastNotification({ toast, onClose }) {
    const styles = {
        profit: "bg-emerald-50 border-emerald-300 text-emerald-800",
        execution: "bg-purple-50 border-purple-300 text-purple-800",
        success: "bg-green-50 border-green-300 text-green-800",
        error: "bg-red-50 border-red-300 text-red-800",
        info: "bg-blue-50 border-blue-300 text-blue-800",
    };

    return (
        <div className={`${styles[toast.type] || styles.info} border rounded-xl p-4 shadow-lg toast-enter`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-semibold text-sm">{toast.title}</p>
                    {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
                </div>
                <button onClick={() => onClose(toast.id)} className="opacity-60 hover:opacity-100">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
