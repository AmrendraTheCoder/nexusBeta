import React, { useState, useEffect } from "react";
import { X, Trophy, TrendingUp, Star, Copy, Users, Flame, Medal, Crown, ArrowRight } from "lucide-react";

// Mock leaderboard data - would come from backend in production
const mockLeaderboard = [
    { rank: 1, address: "0x7a25...3f91", username: "DeFiWhale", totalProfit: 145230, winRate: 94.2, copiers: 1234, workflows: 8, badge: "crown" },
    { rank: 2, address: "0x3b92...8c4d", username: "AlphaHunter", totalProfit: 98450, winRate: 89.5, copiers: 876, workflows: 12, badge: "medal" },
    { rank: 3, address: "0x5f18...2a6e", username: "YieldFarmer", totalProfit: 76890, winRate: 87.3, copiers: 654, workflows: 6, badge: "medal" },
    { rank: 4, address: "0x9c44...1b7f", username: "CryptoSage", totalProfit: 54320, winRate: 82.1, copiers: 432, workflows: 15, badge: null },
    { rank: 5, address: "0x2e67...9d3c", username: "AaveMaster", totalProfit: 43210, winRate: 79.8, copiers: 321, workflows: 9, badge: null },
    { rank: 6, address: "0x8a13...5e2b", username: "UniSwapper", totalProfit: 32100, winRate: 76.4, copiers: 234, workflows: 7, badge: null },
    { rank: 7, address: "0x4d89...7f1a", username: "LiquidityKing", totalProfit: 28900, winRate: 74.2, copiers: 198, workflows: 11, badge: null },
    { rank: 8, address: "0x1c56...4g8h", username: "SafeTrader", totalProfit: 24500, winRate: 71.8, copiers: 156, workflows: 5, badge: null },
];

const topWorkflows = [
    { id: 1, name: "ETH DCA + Auto-Compound", creator: "DeFiWhale", roi: 47.2, copiers: 456, category: "defi" },
    { id: 2, name: "Health Factor Guardian", creator: "AaveMaster", roi: 32.8, copiers: 234, category: "risk" },
    { id: 3, name: "Cross-Chain Arbitrage", creator: "AlphaHunter", roi: 28.5, copiers: 189, category: "crosschain" },
    { id: 4, name: "AI Sentiment Trader", creator: "CryptoSage", roi: 24.1, copiers: 156, category: "ai" },
];

export default function LeaderboardPanel({ isOpen, onClose, onCopyWorkflow }) {
    const [activeTab, setActiveTab] = useState("traders");
    const [timeframe, setTimeframe] = useState("30d");

    if (!isOpen) return null;

    const getBadgeIcon = (badge) => {
        if (badge === "crown") return <Crown size={16} className="text-amber-500" />;
        if (badge === "medal") return <Medal size={16} className="text-slate-400" />;
        return null;
    };

    const getRankStyle = (rank) => {
        if (rank === 1) return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white";
        if (rank === 2) return "bg-gradient-to-r from-slate-300 to-slate-400 text-white";
        if (rank === 3) return "bg-gradient-to-r from-amber-600 to-orange-600 text-white";
        return "bg-slate-100 text-slate-600";
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

            <div className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Trophy className="text-white" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                            <p className="text-amber-100 text-sm">Top performers & workflows</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-lg transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("traders")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "traders" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-500"}`}
                    >
                        <Users size={14} className="inline mr-1" /> Top Traders
                    </button>
                    <button
                        onClick={() => setActiveTab("workflows")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "workflows" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-500"}`}
                    >
                        <Flame size={14} className="inline mr-1" /> Hot Workflows
                    </button>
                </div>

                {/* Timeframe Filter */}
                <div className="px-4 py-3 flex gap-2">
                    {["7d", "30d", "all"].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 text-xs rounded-lg font-medium ${timeframe === t ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                            {t === "all" ? "All Time" : t}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "traders" ? (
                        <div className="space-y-2">
                            {mockLeaderboard.map((trader) => (
                                <div key={trader.rank} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${getRankStyle(trader.rank)}`}>
                                            {trader.rank}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">{trader.username}</span>
                                                {getBadgeIcon(trader.badge)}
                                            </div>
                                            <span className="text-xs text-slate-500">{trader.address}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-600 font-semibold">+${trader.totalProfit.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">{trader.winRate}% win rate</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span><Users size={12} className="inline" /> {trader.copiers} copiers</span>
                                        <span>{trader.workflows} workflows</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topWorkflows.map((wf) => (
                                <div key={wf.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{wf.name}</h4>
                                            <p className="text-xs text-slate-500">by {wf.creator}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${wf.category === "defi" ? "bg-amber-100 text-amber-700" :
                                                wf.category === "risk" ? "bg-red-100 text-red-700" :
                                                    wf.category === "crosschain" ? "bg-blue-100 text-blue-700" :
                                                        "bg-purple-100 text-purple-700"
                                            }`}>{wf.category}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-green-600 font-semibold">+{wf.roi}% ROI</span>
                                            <span className="text-slate-500"><Copy size={12} className="inline" /> {wf.copiers}</span>
                                        </div>
                                        <button
                                            onClick={() => onCopyWorkflow?.(wf)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                                        >
                                            <Copy size={12} /> Copy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Total Volume: $12.4M</span>
                        <span>Active Traders: 2,341</span>
                        <span>Workflows: 847</span>
                    </div>
                </div>
            </div>
        </>
    );
}
