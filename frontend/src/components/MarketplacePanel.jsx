import React, { useState } from "react";
import {
    X, Search, Globe, Zap, DollarSign, Shield, Plus, Star,
    TrendingUp, Cloud, Database, Brain, ArrowRight, Check
} from "lucide-react";

// Mock x402-enabled API catalog
const apiCatalog = [
    {
        id: "pyth-realtime",
        name: "Pyth Real-time Prices",
        provider: "Pyth Network",
        category: "oracle",
        description: "Sub-second price feeds for 350+ assets",
        pricePerCall: "0.001 CRO",
        rating: 4.9,
        calls24h: "2.4M",
        chains: ["Cronos", "Ethereum", "Solana"],
        featured: true,
    },
    {
        id: "openai-analysis",
        name: "GPT-4 Market Analysis",
        provider: "OpenAI",
        category: "ai",
        description: "AI-powered trading signals and sentiment analysis",
        pricePerCall: "0.05 CRO",
        rating: 4.8,
        calls24h: "890K",
        chains: ["Cronos", "All EVM"],
        featured: true,
    },
    {
        id: "1inch-quotes",
        name: "1inch Best Route Quotes",
        provider: "1inch",
        category: "defi",
        description: "Optimal swap routes across 400+ DEXs",
        pricePerCall: "0.002 CRO",
        rating: 4.7,
        calls24h: "5.1M",
        chains: ["Cronos", "Ethereum", "BSC"],
    },
    {
        id: "defillama-tvl",
        name: "DeFiLlama TVL Data",
        provider: "DefiLlama",
        category: "data",
        description: "Protocol TVL and analytics across all chains",
        pricePerCall: "0.001 CRO",
        rating: 4.6,
        calls24h: "1.2M",
        chains: ["All Chains"],
    },
    {
        id: "chainlink-vrf",
        name: "Chainlink VRF",
        provider: "Chainlink",
        category: "oracle",
        description: "Verifiable random numbers for on-chain applications",
        pricePerCall: "0.01 CRO",
        rating: 4.9,
        calls24h: "450K",
        chains: ["Cronos", "Ethereum", "Polygon"],
    },
    {
        id: "cronos-news",
        name: "Cronos Ecosystem News",
        provider: "Crypto.com",
        category: "data",
        description: "Real-time news feed for Cronos ecosystem",
        pricePerCall: "0.0005 CRO",
        rating: 4.5,
        calls24h: "320K",
        chains: ["Cronos"],
        featured: true,
    },
    {
        id: "whale-alerts",
        name: "Whale Transaction Alerts",
        provider: "Santiment",
        category: "data",
        description: "Large transaction monitoring across chains",
        pricePerCall: "0.008 CRO",
        rating: 4.4,
        calls24h: "180K",
        chains: ["All EVM"],
    },
    {
        id: "risk-score",
        name: "Smart Contract Risk Score",
        provider: "Certik",
        category: "security",
        description: "Real-time security scoring for DeFi protocols",
        pricePerCall: "0.02 CRO",
        rating: 4.8,
        calls24h: "95K",
        chains: ["Cronos", "Ethereum"],
    },
];

const categories = [
    { id: "all", label: "All APIs", icon: Globe },
    { id: "oracle", label: "Oracles", icon: Database },
    { id: "ai", label: "AI/ML", icon: Brain },
    { id: "defi", label: "DeFi", icon: TrendingUp },
    { id: "data", label: "Data", icon: Cloud },
    { id: "security", label: "Security", icon: Shield },
];

export default function MarketplacePanel({ isOpen, onClose, onAddAPI }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [addedAPIs, setAddedAPIs] = useState([]);

    const filteredAPIs = apiCatalog.filter(api => {
        const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            api.provider.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || api.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredAPIs = apiCatalog.filter(api => api.featured);

    const handleAddAPI = (api) => {
        setAddedAPIs([...addedAPIs, api.id]);
        if (onAddAPI) {
            onAddAPI(api);
        }
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.id === category);
        return cat ? cat.icon : Globe;
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            <div className={`fixed top-0 right-0 h-full w-[550px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Globe size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">x402 API Marketplace</h2>
                            <p className="text-xs text-slate-500">Discover payment-enabled services</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search APIs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                    ? "bg-violet-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            <cat.icon size={14} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Featured Section */}
                    {selectedCategory === "all" && searchQuery === "" && (
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                            <div className="flex items-center gap-2 mb-3">
                                <Star size={14} className="text-violet-600" />
                                <span className="text-xs font-semibold text-violet-700 uppercase">Featured APIs</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {featuredAPIs.map((api) => (
                                    <div key={api.id} className="flex-shrink-0 w-48 bg-white rounded-xl p-3 border border-violet-200 shadow-sm">
                                        <p className="font-medium text-slate-800 text-sm truncate">{api.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{api.provider}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-violet-600 font-semibold">{api.pricePerCall}</span>
                                            <button
                                                onClick={() => handleAddAPI(api)}
                                                disabled={addedAPIs.includes(api.id)}
                                                className={`p-1.5 rounded-lg transition-all ${addedAPIs.includes(api.id)
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                                                    }`}
                                            >
                                                {addedAPIs.includes(api.id) ? <Check size={12} /> : <Plus size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* API List */}
                    <div className="px-5 py-3">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-3">
                            {filteredAPIs.length} APIs Available
                        </p>
                        <div className="space-y-2">
                            {filteredAPIs.map((api) => {
                                const CategoryIcon = getCategoryIcon(api.category);
                                const isAdded = addedAPIs.includes(api.id);
                                return (
                                    <div
                                        key={api.id}
                                        className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CategoryIcon size={14} className="text-slate-500" />
                                                    <h4 className="font-medium text-slate-800 text-sm">{api.name}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-2">{api.description}</p>
                                                <div className="flex items-center gap-3 text-[10px]">
                                                    <span className="text-slate-400">{api.provider}</span>
                                                    <span className="flex items-center gap-0.5 text-amber-500">
                                                        <Star size={10} fill="currentColor" />{api.rating}
                                                    </span>
                                                    <span className="text-slate-400">{api.calls24h} calls/24h</span>
                                                </div>
                                                <div className="flex gap-1 mt-2">
                                                    {api.chains.slice(0, 3).map((chain, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded font-medium">
                                                            {chain}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-sm font-semibold text-violet-600">{api.pricePerCall}</span>
                                                <button
                                                    onClick={() => handleAddAPI(api)}
                                                    disabled={isAdded}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAdded
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-violet-600 text-white hover:bg-violet-700"
                                                        }`}
                                                >
                                                    {isAdded ? (
                                                        <>
                                                            <Check size={12} />
                                                            Added
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={12} />
                                                            Add to Flow
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{addedAPIs.length}</span> APIs added to workflow
                        </div>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                        >
                            Done
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
