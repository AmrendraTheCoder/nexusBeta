import React, { useState } from "react";
import {
    X, Newspaper, Clock, ExternalLink, TrendingUp, TrendingDown, AlertCircle,
    RefreshCw, ChevronRight, Globe, DollarSign, Layers, Zap, Flame
} from "lucide-react";

const mockNews = [
    { id: 1, title: "Bitcoin Surges Past $100K as Institutional Adoption Accelerates", summary: "Major financial institutions are increasing their Bitcoin holdings, driving the price to new all-time highs.", source: "CoinDesk", time: "2h ago", category: "bitcoin", sentiment: "bullish", featured: true },
    { id: 2, title: "Ethereum Layer 2 Activity Hits Record High", summary: "Arbitrum and Optimism see unprecedented transaction volumes as users migrate to cheaper solutions.", source: "The Block", time: "4h ago", category: "ethereum", sentiment: "bullish" },
    { id: 3, title: "Cronos zkEVM Mainnet Launch Approaches", summary: "The Cronos ecosystem prepares for its zero-knowledge rollup launch, attracting DeFi protocols.", source: "Crypto Briefing", time: "5h ago", category: "defi", sentiment: "bullish" },
    { id: 4, title: "SEC Delays Decision on ETF Applications", summary: "The regulatory body extends review periods for several cryptocurrency investment products.", source: "Reuters", time: "6h ago", category: "regulation", sentiment: "neutral" },
    { id: 5, title: "DeFi Protocol Suffers $45M Exploit", summary: "Security researchers identify vulnerability in smart contract logic.", source: "Decrypt", time: "8h ago", category: "defi", sentiment: "bearish" },
    { id: 6, title: "Solana Network Processes 50,000 TPS", summary: "The high-performance blockchain demonstrates capabilities ahead of major launches.", source: "CoinTelegraph", time: "10h ago", category: "defi", sentiment: "bullish" },
];

const categories = [
    { id: "all", label: "All" },
    { id: "bitcoin", label: "BTC" },
    { id: "ethereum", label: "ETH" },
    { id: "defi", label: "DeFi" },
];

export default function NewsPanel({ isOpen, onClose }) {
    const [news] = useState(mockNews);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("all");

    const filteredNews = selectedCategory === "all" ? news : news.filter(n => n.category === selectedCategory);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Newspaper size={20} className="text-slate-600" />
                        <div>
                            <h2 className="font-semibold text-slate-800">Market News</h2>
                            <p className="text-xs text-slate-500">Latest crypto updates</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Category Filter */}
                <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat.id
                                    ? "bg-slate-800 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Scrollable News List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredNews.map((item, index) => (
                        <div
                            key={item.id}
                            className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${index === 0 && item.featured ? "bg-slate-50" : ""}`}
                        >
                            {index === 0 && item.featured && (
                                <div className="flex items-center gap-1 mb-2">
                                    <Flame size={12} className="text-orange-500" />
                                    <span className="text-[10px] font-semibold text-orange-600 uppercase">Featured</span>
                                </div>
                            )}
                            <h4 className="font-medium text-slate-800 text-sm leading-snug mb-1.5">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.summary}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="font-medium">{item.source}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5"><Clock size={10} />{item.time}</span>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${item.sentiment === "bullish" ? "bg-green-100 text-green-700" :
                                        item.sentiment === "bearish" ? "bg-red-100 text-red-700" :
                                            "bg-slate-100 text-slate-600"
                                    }`}>
                                    {item.sentiment === "bullish" ? "↑" : item.sentiment === "bearish" ? "↓" : "—"}
                                </span>
                            </div>
                        </div>
                    ))}

                    {filteredNews.length === 0 && (
                        <div className="py-12 text-center text-slate-400">
                            <Newspaper size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No news in this category</p>
                        </div>
                    )}
                </div>

                {/* Market Stats Footer */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Fear & Greed</p>
                            <p className="text-sm font-semibold text-green-600">72</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">BTC Dom</p>
                            <p className="text-sm font-semibold text-slate-700">54.2%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Market Cap</p>
                            <p className="text-sm font-semibold text-slate-700">$3.2T</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
