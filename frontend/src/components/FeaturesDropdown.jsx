import React, { useState, useRef, useEffect } from "react";
import {
    ChevronDown, Key, Brain, Sparkles, TrendingUp,
    BarChart3, Target, Shield, Eye, Zap, Bot, Activity, Trophy
} from "lucide-react";

/**
 * FeaturesDropdown - AI Trading & Automation Features
 */
export default function FeaturesDropdown({
    onOpenSessionKeys,
    onOpenAIPanel,
    onOpenLeaderboard,
    onOpenLiveTrading,
    onOpenTransactions,
    onOpenProviders,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const featureCategories = [
        {
            title: "AI Trading",
            items: [
                {
                    icon: Brain,
                    label: "AI Trading Agent",
                    description: "Generate trading workflows from text",
                    onClick: onOpenAIPanel,
                    badge: "NEW",
                    badgeColor: "bg-emerald-500",
                },
                {
                    icon: Eye,
                    label: "Vision Analysis",
                    description: "Analyze charts with AI vision",
                    onClick: onOpenAIPanel,
                    badge: "AI",
                    badgeColor: "bg-purple-500",
                },
                {
                    icon: BarChart3,
                    label: "Live Dashboard",
                    description: "Real-time trading monitor",
                    onClick: onOpenLiveTrading,
                    badge: "LIVE",
                    badgeColor: "bg-red-500",
                },
            ],
        },
        {
            title: "Risk Management",
            items: [
                {
                    icon: Shield,
                    label: "Risk Manager",
                    description: "Position limits & daily loss caps",
                    onClick: onOpenAIPanel,
                },
                {
                    icon: Target,
                    label: "Stop-Loss Monitor",
                    description: "Auto SL/TP with trailing stops",
                    onClick: onOpenAIPanel,
                },
            ],
        },
        {
            title: "Automation",
            items: [
                {
                    icon: Key,
                    label: "Session Keys",
                    description: "Gasless automated execution",
                    onClick: onOpenSessionKeys,
                    badge: "PRO",
                    badgeColor: "bg-violet-500",
                },
                {
                    icon: Zap,
                    label: "Auto-Execute",
                    description: "Run workflows on schedule",
                    onClick: () => { },
                },
            ],
        },
        {
            title: "Social Trading",
            items: [
                {
                    icon: TrendingUp,
                    label: "Leaderboard",
                    description: "Top performing strategies",
                    onClick: onOpenLeaderboard,
                    badge: "HOT",
                    badgeColor: "bg-orange-500",
                },
                {
                    icon: Trophy,
                    label: "Providers",
                    description: "Provider reputation & analytics",
                    onClick: onOpenProviders,
                },
            ],
        },
        {
            title: "History",
            items: [
                {
                    icon: Activity,
                    label: "Transactions",
                    description: "View transaction history",
                    onClick: onOpenTransactions,
                },
            ],
        },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isOpen
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 hover:from-violet-100 hover:to-purple-100 border border-violet-200"
                    }`}
            >
                <Sparkles size={16} />
                Features
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Bot size={18} />
                            AI Trading Features
                        </h3>
                        <p className="text-violet-200 text-xs">Automated DeFi strategies</p>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {featureCategories.map((category, catIndex) => (
                            <div key={catIndex} className="p-3 border-b border-slate-100 last:border-b-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {category.title}
                                </p>
                                <div className="space-y-1">
                                    {category.items.map((item, itemIndex) => (
                                        <button
                                            key={itemIndex}
                                            onClick={() => {
                                                item.onClick?.();
                                                setIsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                                        >
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                                <item.icon size={16} className="text-slate-600 group-hover:text-violet-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-800 text-sm">
                                                        {item.label}
                                                    </span>
                                                    {item.badge && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold ${item.badgeColor}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
