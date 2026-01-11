import { useState } from "react";
import {
    X, Brain, Eye, Sparkles, Target, Shield, AlertTriangle,
    BarChart3, Wallet, Loader, TrendingUp, Repeat,
    GitBranch, ChevronDown, ChevronRight, Zap, ShieldCheck, UserCheck
} from "lucide-react";

/**
 * AITradingPanel - Right sliding panel for AI Trading mode (like LiveTradingDashboard)
 * Contains AI trading nodes and quick strategy builder
 */
export default function AITradingPanel({ isOpen, onClose, onAddNode, onLoadTemplate }) {
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        safety: true,
        analysis: true,
        execution: true,
        risk: true,
        data: false,
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleGenerateStrategy = async () => {
        if (!aiPrompt.trim() || isGenerating) return;
        setIsGenerating(true);

        // Use environment variable or fallback to localhost
        const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";

        try {
            const response = await fetch(`${backendUrl}/api/ai/generate-workflow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt, mode: "trading" }),
            });
            const result = await response.json();
            if (result.success && onLoadTemplate) {
                onLoadTemplate(result.workflow);
                setAiPrompt("");
                onClose();
            }
        } catch (error) {
            console.error("AI generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const nodeCategories = [
        {
            id: "safety",
            title: "Trust & Safety",
            icon: <ShieldCheck size={16} className="text-emerald-500" />,
            color: "emerald",
            badge: "REQUIRED",
            nodes: [
                { type: "maxInvestment", label: "Max Investment Limit", icon: <ShieldCheck size={16} />, desc: "Cap trade sizes", required: true },
                { type: "dailyLossLimit", label: "Daily Loss Limit", icon: <Shield size={16} />, desc: "Stop at loss limit", required: true },
                { type: "userConfirmation", label: "User Confirmation", icon: <UserCheck size={16} />, desc: "Require approval", required: true },
            ],
        },
        {
            id: "analysis",
            title: "AI Analysis",
            icon: <Brain size={16} className="text-violet-500" />,
            color: "violet",
            nodes: [
                { type: "tradingAgent", label: "AI Trading Agent", icon: <Brain size={16} />, desc: "Generate buy/sell signals" },
                { type: "visionAnalysis", label: "Vision Analysis", icon: <Eye size={16} />, desc: "Analyze charts with AI" },
                { type: "aiPrediction", label: "AI Prediction", icon: <Sparkles size={16} />, desc: "Price predictions via NIP-1" },
            ],
        },
        {
            id: "execution",
            title: "Trade Execution",
            icon: <Repeat size={16} className="text-blue-500" />,
            color: "blue",
            nodes: [
                { type: "swap", label: "Execute Trade", icon: <Repeat size={16} />, desc: "Swap tokens on DEX" },
                { type: "limitOrder", label: "Limit Order", icon: <Target size={16} />, desc: "Place limit orders" },
                { type: "condition", label: "Trade Condition", icon: <GitBranch size={16} />, desc: "Conditional logic" },
            ],
        },
        {
            id: "risk",
            title: "Risk Management",
            icon: <Shield size={16} className="text-red-500" />,
            color: "red",
            nodes: [
                { type: "stopLoss", label: "Stop-Loss Monitor", icon: <AlertTriangle size={16} />, desc: "Auto SL/TP with trailing" },
                { type: "riskManager", label: "Risk Manager", icon: <Shield size={16} />, desc: "Position limits & caps" },
            ],
        },
        {
            id: "data",
            title: "Market Data",
            icon: <BarChart3 size={16} className="text-cyan-500" />,
            color: "cyan",
            nodes: [
                { type: "pyth-network", label: "Price Feed", icon: <BarChart3 size={16} />, desc: "Real-time prices" },
                { type: "queryBalance", label: "Portfolio Balance", icon: <Wallet size={16} />, desc: "Check wallet balance" },
            ],
        },
    ];

    const quickTemplates = [
        { name: "BTC Momentum Bot", desc: "Buy on bullish signals, 5% SL" },
        { name: "ETH DCA Strategy", desc: "Dollar cost average weekly" },
        { name: "Safe Trading Setup", desc: "All safety nodes pre-configured" },
    ];

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Sliding Panel - RIGHT side */}
            <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Trading Nodes</h2>
                            <p className="text-emerald-100 text-sm">Build automated strategies</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* AI Strategy Builder */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-700">AI Strategy Builder</span>
                            </div>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Create a BTC trading bot that buys when RSI < 30 and sells when RSI > 70 with 5% stop-loss..."
                                className="w-full p-3 text-sm border border-emerald-200 rounded-lg resize-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
                                rows={3}
                            />
                            <button
                                onClick={handleGenerateStrategy}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isGenerating ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                                {isGenerating ? "Generating..." : "Generate Strategy"}
                            </button>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="p-4 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Templates</p>
                        <div className="grid grid-cols-1 gap-2">
                            {quickTemplates.map((template, i) => (
                                <button
                                    key={i}
                                    className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-colors group"
                                >
                                    <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">{template.name}</p>
                                    <p className="text-xs text-slate-500">{template.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Node Categories */}
                    <div className="p-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Trading Nodes</p>

                        {nodeCategories.map((category) => (
                            <div key={category.id} className="mb-3">
                                <button
                                    onClick={() => toggleSection(category.id)}
                                    className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {category.icon}
                                        <span className="text-sm font-semibold text-slate-700">{category.title}</span>
                                        {category.badge && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                                {category.badge}
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections[category.id] ? (
                                        <ChevronDown size={16} className="text-slate-400" />
                                    ) : (
                                        <ChevronRight size={16} className="text-slate-400" />
                                    )}
                                </button>

                                {expandedSections[category.id] && (
                                    <div className="mt-2 space-y-1.5 pl-2">
                                        {category.nodes.map((node) => (
                                            <button
                                                key={node.type}
                                                onClick={() => onAddNode(node.type)}
                                                className={`w-full flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-${category.color}-300 hover:bg-${category.color}-50 transition-all group text-left`}
                                            >
                                                <span className={`text-${category.color}-500`}>{node.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                        {node.label}
                                                        {node.required && (
                                                            <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-600 rounded font-bold">REQUIRED</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">{node.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
}
