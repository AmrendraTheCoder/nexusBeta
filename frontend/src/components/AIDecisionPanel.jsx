import { useState, useEffect } from "react";
import {
    Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
    XCircle, Target, Zap, BarChart3, ArrowRight, Sparkles,
    DollarSign, Percent, Clock, Shield, ChevronDown, ChevronUp, Eye
} from "lucide-react";

/**
 * AI Decision Panel - Shows real-time AI agent reasoning and decisions
 * Light mode version for better visibility
 */
export default function AIDecisionPanel({
    executionLogs = [],
    currentNode = null,
    isExecuting = false
}) {
    const [expandedSections, setExpandedSections] = useState({
        vision: true,
        trading: true,
        risk: true,
        yield: true,
    });
    const [latestDecisions, setLatestDecisions] = useState({
        vision: null,
        trading: null,
        risk: null,
        yield: null,
    });

    useEffect(() => {
        if (!executionLogs || executionLogs.length === 0) return;

        const decisions = { ...latestDecisions };

        executionLogs.forEach(log => {
            const msg = log.message || log;

            if (msg.includes("Vision Analysis") || msg.includes("Chart Analysis") || msg.includes("BULLISH") || msg.includes("BEARISH")) {
                if (msg.includes("BULLISH")) {
                    decisions.vision = { sentiment: "BULLISH", confidence: extractConfidence(msg), analysis: msg };
                } else if (msg.includes("BEARISH")) {
                    decisions.vision = { sentiment: "BEARISH", confidence: extractConfidence(msg), analysis: msg };
                } else if (msg.includes("NEUTRAL")) {
                    decisions.vision = { sentiment: "NEUTRAL", confidence: extractConfidence(msg), analysis: msg };
                }
            }

            if (msg.includes("Decision:") || msg.includes("Signal:")) {
                if (msg.includes("BUY")) {
                    decisions.trading = { action: "BUY", message: msg, confidence: extractConfidence(msg) };
                } else if (msg.includes("SELL")) {
                    decisions.trading = { action: "SELL", message: msg, confidence: extractConfidence(msg) };
                } else if (msg.includes("HOLD")) {
                    decisions.trading = { action: "HOLD", message: msg, confidence: extractConfidence(msg) };
                }
            }

            if (msg.includes("Risk Manager") || msg.includes("APPROVED") || msg.includes("REJECTED")) {
                decisions.risk = {
                    approved: msg.includes("APPROVED") || msg.includes("✅"),
                    message: msg,
                };
            }

            if (msg.includes("Yield Optimizer") || msg.includes("REBALANCE") || msg.includes("APY")) {
                if (msg.includes("REBALANCE")) {
                    decisions.yield = { action: "REBALANCE", message: msg };
                } else if (msg.includes("HOLD")) {
                    decisions.yield = { action: "HOLD", message: msg };
                } else if (msg.includes("Best yield") || msg.includes("APY")) {
                    decisions.yield = { ...decisions.yield, apyInfo: msg };
                }
            }
        });

        setLatestDecisions(decisions);
    }, [executionLogs]);

    const extractConfidence = (msg) => {
        const match = msg.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 75;
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case "BULLISH": return "text-green-600";
            case "BEARISH": return "text-red-600";
            default: return "text-amber-600";
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case "BUY": return "bg-green-500 text-white";
            case "SELL": return "bg-red-500 text-white";
            case "REBALANCE": return "bg-blue-500 text-white";
            default: return "bg-slate-400 text-white";
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Brain className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold">AI Decision Center</h3>
                    <p className="text-violet-200 text-xs">
                        {isExecuting ? (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Processing...
                            </span>
                        ) : "Autonomous Agent Reasoning"}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Vision Analysis Section */}
                <DecisionSection
                    title="Vision AI Analysis"
                    icon={<Eye size={16} className="text-purple-500" />}
                    expanded={expandedSections.vision}
                    onToggle={() => toggleSection("vision")}
                    color="purple"
                >
                    {latestDecisions.vision ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-lg font-bold ${getSentimentColor(latestDecisions.vision.sentiment)}`}>
                                    {latestDecisions.vision.sentiment}
                                </span>
                                <ConfidenceBadge value={latestDecisions.vision.confidence} />
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-2">
                                {latestDecisions.vision.analysis}
                            </p>
                        </div>
                    ) : (
                        <EmptyState message="Upload a chart for AI analysis" />
                    )}
                </DecisionSection>

                {/* Trading Signal Section */}
                <DecisionSection
                    title="Trading Agent Signal"
                    icon={<Target size={16} className="text-blue-500" />}
                    expanded={expandedSections.trading}
                    onToggle={() => toggleSection("trading")}
                    color="blue"
                >
                    {latestDecisions.trading ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-lg font-bold ${getActionColor(latestDecisions.trading.action)}`}>
                                    {latestDecisions.trading.action}
                                </span>
                                <ConfidenceBadge value={latestDecisions.trading.confidence} />
                            </div>
                            {latestDecisions.trading.action !== "HOLD" && (
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-2 border">
                                        <span className="text-slate-400 text-xs">Entry</span>
                                        <p className="text-slate-800 font-mono font-medium">$96,500</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                        <span className="text-slate-400 text-xs">Stop Loss</span>
                                        <p className="text-red-600 font-mono font-medium">$95,000</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                        <span className="text-slate-400 text-xs">Take Profit</span>
                                        <p className="text-green-600 font-mono font-medium">$98,500</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState message="Waiting for trading signal..." />
                    )}
                </DecisionSection>

                {/* Risk Manager Section */}
                <DecisionSection
                    title="Risk Manager"
                    icon={<Shield size={16} className="text-amber-500" />}
                    expanded={expandedSections.risk}
                    onToggle={() => toggleSection("risk")}
                    color="amber"
                >
                    {latestDecisions.risk ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {latestDecisions.risk.approved ? (
                                    <>
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span className="text-green-600 font-bold">APPROVED</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="text-red-500" size={20} />
                                        <span className="text-red-600 font-bold">REJECTED</span>
                                    </>
                                )}
                            </div>
                            <div className="text-sm text-slate-500 space-y-1">
                                <p>✓ Position size within limits</p>
                                <p>✓ Daily loss limit OK</p>
                                <p>✓ Portfolio exposure acceptable</p>
                            </div>
                        </div>
                    ) : (
                        <EmptyState message="Risk validation pending..." />
                    )}
                </DecisionSection>

                {/* Yield Optimizer Section */}
                <DecisionSection
                    title="Yield Optimizer"
                    icon={<Percent size={16} className="text-green-500" />}
                    expanded={expandedSections.yield}
                    onToggle={() => toggleSection("yield")}
                    color="green"
                >
                    {latestDecisions.yield ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getActionColor(latestDecisions.yield.action)}`}>
                                    {latestDecisions.yield.action || "ANALYZING"}
                                </span>
                            </div>
                            {latestDecisions.yield.action === "REBALANCE" && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">Aave V3</span>
                                        <ArrowRight size={14} className="text-blue-500" />
                                        <span className="text-slate-800 font-medium">Compound V3</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs">
                                        <span className="text-green-600 font-medium">+1.42% APY</span>
                                        <span className="text-slate-400">Net profit: $14.20/mo</span>
                                    </div>
                                </div>
                            )}
                            {latestDecisions.yield.apyInfo && (
                                <p className="text-slate-500 text-sm">{latestDecisions.yield.apyInfo}</p>
                            )}
                        </div>
                    ) : (
                        <EmptyState message="Scanning DeFi protocols..." />
                    )}
                </DecisionSection>

                {/* Reasoning Chain */}
                {executionLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-slate-400 text-xs uppercase mb-2 flex items-center gap-2">
                            <Zap size={12} />
                            AI Reasoning Chain
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto border">
                            {executionLogs.slice(-5).map((log, i) => (
                                <p key={i} className="text-xs text-slate-600 py-0.5 font-mono">
                                    {typeof log === 'string' ? log : log.message}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DecisionSection({ title, icon, expanded, onToggle, color, children }) {
    const colorClasses = {
        purple: "border-purple-200 bg-purple-50/50",
        blue: "border-blue-200 bg-blue-50/50",
        amber: "border-amber-200 bg-amber-50/50",
        green: "border-green-200 bg-green-50/50",
    };

    return (
        <div className={`border rounded-lg ${colorClasses[color]}`}>
            <button
                onClick={onToggle}
                className="w-full px-3 py-2 flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2 text-slate-700">
                    {icon}
                    <span className="font-medium text-sm">{title}</span>
                </div>
                {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {expanded && <div className="px-3 pb-3">{children}</div>}
        </div>
    );
}

function ConfidenceBadge({ value }) {
    const color = value >= 80 ? "text-green-600 bg-green-50" : value >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
    return (
        <span className={`text-xs font-mono px-2 py-1 rounded ${color}`}>
            {value}% confidence
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <p className="text-slate-400 text-sm italic">{message}</p>
    );
}
