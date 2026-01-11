import React, { useState, useEffect } from "react";
import {
    X, Bot, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Loader, Zap, Play,
    Activity, Target, Shield, Clock, DollarSign, BarChart2, Layers, ChevronRight,
    Brain, LineChart, PieChart, Gauge, MessageSquare, Wand2
} from "lucide-react";
import { NODE_CONFIG } from "../config/nodeConfig";

// Enhanced mock analysis with more detailed data
const mockAnalysis = {
    ETH: {
        sentiment: "bullish",
        confidence: 85,
        riskLevel: "medium",
        summary: "Strong upward momentum detected. RSI indicates oversold conditions reversing. Volume increasing with institutional accumulation.",
        technicalIndicators: {
            rsi: 42,
            macd: "bullish_crossover",
            movingAverage: "above_200d",
            volume: "+23%",
            support: 3200,
            resistance: 3800,
        },
        signals: [
            { type: "buy", strength: "strong", reason: "Golden cross forming on 4H chart" },
            { type: "hold", strength: "moderate", reason: "Wait for confirmation above $3,600 resistance" },
            { type: "buy", strength: "weak", reason: "Accumulation detected in order book" },
        ],
        priceTargets: {
            bullish: 4200,
            neutral: 3600,
            bearish: 2800,
        },
        suggestedWorkflows: [
            {
                name: "ETH Momentum Strategy",
                description: "Buy ETH when price breaks $3,600 resistance",
                risk: "medium",
                expectedReturn: "+15-25%",
                timeframe: "1-2 weeks",
                nodes: [
                    { type: "pyth-network", label: "Pyth Price Feed", config: { symbol: "ETH_USD" } },
                    { type: "condition", label: "Price > $3,600?", config: { condition: "price > 3600" } },
                    { type: "swap", label: "Swap USDC to ETH", config: {} },
                ],
            },
            {
                name: "ETH DCA Strategy",
                description: "Dollar-cost average into ETH on dips",
                risk: "low",
                expectedReturn: "+10-15%",
                timeframe: "1-3 months",
                nodes: [
                    { type: "pyth-network", label: "Pyth Price Feed", config: { symbol: "ETH_USD" } },
                    { type: "condition", label: "Price < $3,200?", config: { condition: "price < 3200" } },
                    { type: "swap", label: "Swap USDC to ETH", config: {} },
                ],
            },
        ],
    },
    BTC: {
        sentiment: "neutral",
        confidence: 65,
        riskLevel: "high",
        summary: "Consolidation phase near all-time highs. Price trading within defined range. Awaiting breakout direction with high volatility expected.",
        technicalIndicators: {
            rsi: 55,
            macd: "neutral",
            movingAverage: "above_200d",
            volume: "-5%",
            support: 92000,
            resistance: 105000,
        },
        signals: [
            { type: "hold", strength: "strong", reason: "Wait for clear breakout above $100K or below $95K" },
            { type: "buy", strength: "weak", reason: "Long-term accumulation still valid" },
        ],
        priceTargets: {
            bullish: 120000,
            neutral: 98000,
            bearish: 85000,
        },
        suggestedWorkflows: [
            {
                name: "BTC Range Trading",
                description: "Trade the range with limit orders",
                risk: "medium",
                expectedReturn: "+8-12%",
                timeframe: "1-2 weeks",
                nodes: [
                    { type: "pyth-network", label: "Pyth Price Feed", config: { symbol: "BTC_USD" } },
                    { type: "condition", label: "Price < $95K?", config: { condition: "price < 95000" } },
                    { type: "limitOrder", label: "Place Limit Order", config: {} },
                ],
            },
        ],
    },
    CRO: {
        sentiment: "bullish",
        confidence: 72,
        riskLevel: "high",
        summary: "Positive ecosystem developments driving accumulation. Strong support at current levels with upside potential.",
        technicalIndicators: {
            rsi: 38,
            macd: "bullish_divergence",
            movingAverage: "below_200d",
            volume: "+45%",
            support: 0.12,
            resistance: 0.22,
        },
        signals: [
            { type: "buy", strength: "moderate", reason: "Accumulation zone identified" },
            { type: "buy", strength: "strong", reason: "Volume spike indicates institutional interest" },
        ],
        priceTargets: {
            bullish: 0.35,
            neutral: 0.18,
            bearish: 0.10,
        },
        suggestedWorkflows: [
            {
                name: "CRO Accumulation",
                description: "DCA into CRO during accumulation phase",
                risk: "high",
                expectedReturn: "+50-100%",
                timeframe: "3-6 months",
                nodes: [
                    { type: "queryBalance", label: "Query Balance", config: {} },
                    { type: "condition", label: "Balance > 100?", config: { condition: "price > 100" } },
                    { type: "swap", label: "Swap USDC to CRO", config: {} },
                ],
            },
        ],
    },
};

const tokens = ["ETH", "BTC", "CRO", "SOL", "USDC"];

const sentimentColors = {
    bullish: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", gradient: "from-green-500 to-emerald-500" },
    bearish: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", gradient: "from-red-500 to-rose-500" },
    neutral: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-500 to-orange-500" },
};

const riskColors = {
    low: "text-green-600 bg-green-100",
    medium: "text-amber-600 bg-amber-100",
    high: "text-red-600 bg-red-100",
};

export default function AIAgentPanel({ isOpen, onClose, onCreateWorkflow, onAddNodes }) {
    const [selectedToken, setSelectedToken] = useState("ETH");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState("signals");
    const [selectedWorkflow, setSelectedWorkflow] = useState(0);

    // Text-to-DeFi state
    const [panelMode, setPanelMode] = useState("analyze"); // "analyze" or "text-to-defi"
    const [promptText, setPromptText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState(null);
    const [generationError, setGenerationError] = useState(null);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setTimeout(() => {
            setAnalysis(mockAnalysis[selectedToken] || mockAnalysis.ETH);
            setIsAnalyzing(false);
            setActiveTab("signals");
            setSelectedWorkflow(0);
        }, 2500);
    };

    const handleGenerateFromPrompt = async () => {
        if (!promptText.trim()) return;

        setIsGenerating(true);
        setGenerationError(null);
        setGenerationResult(null);

        // Use environment variable or fallback to localhost
        const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";

        try {
            const response = await fetch(`${backendUrl}/api/ai/generate-workflow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: promptText }),
            });

            const data = await response.json();

            if (data.success && data.workflow) {
                setGenerationResult(data);
            } else {
                setGenerationError(data.message || "Failed to generate workflow");
            }
        } catch (error) {
            console.error("[AI Panel] Generation error:", error);
            setGenerationError("Failed to connect to AI service. Make sure the backend is running on port 3001.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyGeneratedWorkflow = () => {
        if (!generationResult?.workflow?.nodes) return;

        if (onAddNodes) {
            // Pass both nodes and edges from the generated workflow
            onAddNodes(generationResult.workflow.nodes, generationResult.workflow.edges || []);
        }
        onClose();
    };

    const handleCreateWorkflow = () => {
        if (!analysis?.suggestedWorkflows?.[selectedWorkflow]) return;

        const workflow = analysis.suggestedWorkflows[selectedWorkflow];
        const newNodes = workflow.nodes.map((nodeInfo, index) => {
            const config = NODE_CONFIG[nodeInfo.type] || {};
            return {
                id: `ai-${Date.now()}-${index}`,
                type: "custom",
                position: { x: 100 + index * 300, y: 150 },
                data: {
                    label: nodeInfo.label,
                    type: nodeInfo.type,
                    inputs: config.inputs || {},
                    outputs: config.outputs || {},
                    node_data: { ...config.node_data, ...nodeInfo.config },
                },
            };
        });

        if (onAddNodes) {
            onAddNodes(newNodes);
        }
        onClose();
    };

    if (!isOpen) return null;

    const colors = analysis ? sentimentColors[analysis.sentiment] : sentimentColors.neutral;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Brain className="text-white" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Trading Analyst</h2>
                            <p className="text-violet-200 text-sm">Advanced market analysis powered by x402</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setPanelMode("analyze"); setGenerationResult(null); setGenerationError(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${panelMode === "analyze"
                                ? "bg-white text-violet-700 shadow-sm"
                                : "text-slate-600 hover:text-slate-800"
                                }`}
                        >
                            <BarChart2 size={16} />
                            Market Analysis
                        </button>
                        <button
                            onClick={() => { setPanelMode("text-to-defi"); setAnalysis(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${panelMode === "text-to-defi"
                                ? "bg-white text-violet-700 shadow-sm"
                                : "text-slate-600 hover:text-slate-800"
                                }`}
                        >
                            <Wand2 size={16} />
                            Text-to-DeFi
                        </button>
                    </div>

                    {/* Text-to-DeFi Mode */}
                    {panelMode === "text-to-defi" && (
                        <div className="space-y-6">
                            {/* Example Prompts */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-medium text-slate-500 mb-3">Try these examples:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Create an AI trading strategy for BTC with chart analysis",
                                        "Buy ETH when price drops below $3000",
                                        "Monitor DeFi yields and auto-rebalance",
                                        "Scan for arbitrage opportunities across DEXes"
                                    ].map((example, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPromptText(example)}
                                            className="text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Prompt Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Describe your DeFi strategy
                                </label>
                                <textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder="e.g., Create an AI trading strategy that analyzes BTC charts and news sentiment to generate buy/sell signals..."
                                    className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none text-slate-700 placeholder-slate-400"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Tip: Mention "AI trading", "chart analysis", or "news sentiment" for full AI workflows
                                </p>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateFromPrompt}
                                disabled={isGenerating || !promptText.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                            >
                                {isGenerating ? <Loader size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                {isGenerating ? "Generating Workflow..." : "Generate Workflow"}
                            </button>

                            {/* Error Display */}
                            {generationError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    <AlertTriangle size={16} className="inline mr-2" />
                                    {generationError}
                                </div>
                            )}

                            {/* Result Display */}
                            {generationResult && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                            <Sparkles size={16} />
                                            Workflow Generated!
                                            {generationResult.mode === "fallback" && (
                                                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full ml-2">
                                                    Pre-built Template
                                                </span>
                                            )}
                                            {generationResult.mode === "ai" && (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">
                                                    AI Generated
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-green-600">
                                            Created {generationResult.workflow.nodes.length} nodes with{" "}
                                            {generationResult.workflow.edges?.length || 0} connections.
                                        </p>
                                        {generationResult.strategyType && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Strategy: <span className="font-medium">{generationResult.strategyType}</span>
                                            </p>
                                        )}
                                        {generationResult.message && (
                                            <p className="text-xs text-slate-500 mt-2">{generationResult.message}</p>
                                        )}
                                    </div>

                                    {/* Preview Nodes */}
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500 mb-3 font-medium">Workflow Preview:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {generationResult.workflow.nodes.map((node, i) => (
                                                <span
                                                    key={node.id}
                                                    className="text-xs bg-white px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 font-medium"
                                                >
                                                    {i + 1}. {node.data?.label || node.data?.type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Apply Button */}
                                    <button
                                        onClick={handleApplyGeneratedWorkflow}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                                    >
                                        <Play size={18} />
                                        Add to Canvas
                                    </button>
                                </div>
                            )}

                            {/* Empty State */}
                            {!isGenerating && !generationResult && !generationError && (
                                <div className="text-center py-8 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm">Describe your strategy above and click Generate</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Market Analysis Mode */}
                    {panelMode === "analyze" && (
                        <>
                            {/* Token Selector */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex gap-2">
                                    {tokens.map((token) => (
                                        <button
                                            key={token}
                                            onClick={() => { setSelectedToken(token); setAnalysis(null); }}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedToken === token
                                                ? "bg-violet-600 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {token}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={runAnalysis}
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {isAnalyzing ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                                </button>
                            </div>

                            {/* Loading State */}
                            {isAnalyzing && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Brain size={40} className="text-violet-500 animate-pulse" />
                                    </div>
                                    <p className="text-lg text-slate-700 font-medium">Analyzing {selectedToken} market data...</p>
                                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-slate-500">
                                        <Activity size={14} className="animate-pulse" />
                                        Processing technical indicators, sentiment, and on-chain data
                                    </div>
                                    <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto mt-6 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                                    </div>
                                </div>
                            )}

                            {/* Analysis Results */}
                            {analysis && !isAnalyzing && (
                                <div className="space-y-6">
                                    {/* Summary Card */}
                                    <div className={`${colors.bg} ${colors.border} border rounded-xl p-5`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                                                    {analysis.sentiment === "bullish" ? <TrendingUp className="text-white" size={20} /> :
                                                        analysis.sentiment === "bearish" ? <TrendingDown className="text-white" size={20} /> :
                                                            <Activity className="text-white" size={20} />}
                                                </div>
                                                <div>
                                                    <span className={`font-bold text-lg ${colors.text} capitalize`}>{analysis.sentiment} Outlook</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Gauge size={12} className={colors.text} />
                                                        <span className={`text-sm ${colors.text}`}>{analysis.confidence}% Confidence</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${riskColors[analysis.riskLevel]}`}>
                                                {analysis.riskLevel.toUpperCase()} RISK
                                            </span>
                                        </div>
                                        <p className="text-slate-700">{analysis.summary}</p>
                                    </div>

                                    {/* Technical Indicators */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                                            <p className="text-xs text-slate-500 mb-1">RSI (14)</p>
                                            <p className={`text-xl font-bold ${analysis.technicalIndicators.rsi < 30 ? "text-green-600" : analysis.technicalIndicators.rsi > 70 ? "text-red-600" : "text-slate-700"}`}>
                                                {analysis.technicalIndicators.rsi}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{analysis.technicalIndicators.rsi < 30 ? "Oversold" : analysis.technicalIndicators.rsi > 70 ? "Overbought" : "Neutral"}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                                            <p className="text-xs text-slate-500 mb-1">Support</p>
                                            <p className="text-xl font-bold text-slate-700">${analysis.technicalIndicators.support.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400">Key Level</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                                            <p className="text-xs text-slate-500 mb-1">Resistance</p>
                                            <p className="text-xl font-bold text-slate-700">${analysis.technicalIndicators.resistance.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400">Key Level</p>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                        {[
                                            { id: "signals", label: "Signals", icon: AlertTriangle },
                                            { id: "targets", label: "Price Targets", icon: Target },
                                            { id: "workflows", label: "AI Workflows", icon: Zap },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-violet-700" : "text-slate-600 hover:text-slate-800"
                                                    }`}
                                            >
                                                <tab.icon size={14} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    {activeTab === "signals" && (
                                        <div className="space-y-2">
                                            {analysis.signals.map((signal, i) => (
                                                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${signal.type === "buy" ? "bg-green-100 text-green-700" :
                                                        signal.type === "sell" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {signal.type}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-slate-700 font-medium">{signal.reason}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Signal Strength: <span className="font-medium capitalize">{signal.strength}</span></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === "targets" && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                                <TrendingUp className="mx-auto text-green-600 mb-2" size={24} />
                                                <p className="text-xs text-green-600 mb-1">Bullish Target</p>
                                                <p className="text-2xl font-bold text-green-700">${analysis.priceTargets.bullish.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                                <Activity className="mx-auto text-amber-600 mb-2" size={24} />
                                                <p className="text-xs text-amber-600 mb-1">Base Case</p>
                                                <p className="text-2xl font-bold text-amber-700">${analysis.priceTargets.neutral.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                                <TrendingDown className="mx-auto text-red-600 mb-2" size={24} />
                                                <p className="text-xs text-red-600 mb-1">Bearish Target</p>
                                                <p className="text-2xl font-bold text-red-700">${analysis.priceTargets.bearish.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "workflows" && (
                                        <div className="space-y-4">
                                            {analysis.suggestedWorkflows.map((workflow, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setSelectedWorkflow(i)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedWorkflow === i
                                                        ? "border-violet-400 bg-violet-50"
                                                        : "border-slate-200 hover:border-violet-200"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{workflow.name}</h4>
                                                            <p className="text-sm text-slate-600">{workflow.description}</p>
                                                        </div>
                                                        <ChevronRight className={`transition-transform ${selectedWorkflow === i ? "rotate-90 text-violet-600" : "text-slate-400"}`} size={20} />
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs">
                                                        <span className={`px-2 py-1 rounded ${riskColors[workflow.risk]}`}>{workflow.risk} risk</span>
                                                        <span className="text-green-600 font-medium">{workflow.expectedReturn}</span>
                                                        <span className="text-slate-500"><Clock size={12} className="inline mr-1" />{workflow.timeframe}</span>
                                                    </div>
                                                    {selectedWorkflow === i && (
                                                        <div className="mt-4 pt-4 border-t border-violet-200">
                                                            <p className="text-xs text-slate-500 mb-2">Workflow Steps:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {workflow.nodes.map((node, j) => (
                                                                    <span key={j} className="text-xs bg-white px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 font-medium">
                                                                        {j + 1}. {node.label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={handleCreateWorkflow}
                                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                                            >
                                                <Play size={18} />
                                                Create Selected Workflow
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Empty State */}
                            {!analysis && !isAnalyzing && (
                                <div className="text-center py-16 text-slate-400">
                                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Brain size={40} className="text-slate-300" />
                                    </div>
                                    <p className="text-lg text-slate-600 font-medium">Ready to analyze {selectedToken}</p>
                                    <p className="text-sm mt-2">Click "Analyze" to get AI-powered trading insights</p>
                                    <p className="text-xs text-slate-400 mt-4">Uses x402 micropayment for premium AI access</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
