import React, { useState, useEffect } from "react";
import { Lightbulb, ArrowRight, Zap, Sparkles, MessageSquare } from "lucide-react";

export default function SuggestionPanel({ nodes, edges, onConnectNodes }) {
    const [suggestions, setSuggestions] = useState([]);

    // Analyze graph for "unmatched loads" (unconnected outputs)
    useEffect(() => {
        if (!nodes || nodes.length === 0) {
            setSuggestions([]);
            return;
        }

        const newSuggestions = [];

        // 1. Find nodes with unconnected outputs
        nodes.forEach(node => {
            // Skip if node is purely an end node (like Debug or Terminal)
            if (node.type === 'output') return;

            const hasOutgoingConnection = edges.some(edge => edge.source === node.id);

            if (!hasOutgoingConnection) {
                // Logic for suggestions based on node type
                if (node.data.type === 'pyth-network') {
                    newSuggestions.push({
                        id: `sugg-${node.id}`,
                        title: 'Use Price Feed',
                        actionLabel: 'Add Condition',
                        sourceId: node.id,
                        targetType: 'condition',
                        icon: <Zap size={14} className="text-amber-500" />
                    });
                }
                else if (node.data.type === 'condition') {
                    newSuggestions.push({
                        id: `sugg-${node.id}`,
                        title: 'Handle Result',
                        actionLabel: 'Add Swap',
                        sourceId: node.id,
                        targetType: 'swap',
                        icon: <ArrowRight size={14} className="text-blue-500" />
                    });
                }
                else if (node.data.type === 'nexusPay') {
                    newSuggestions.push({
                        id: `sugg-${node.id}`,
                        title: 'Use Paid Data',
                        actionLabel: 'Add Logic',
                        sourceId: node.id,
                        targetType: 'condition',
                        icon: <Lightbulb size={14} className="text-violet-500" />
                    });
                }
            }
        });

        setSuggestions(newSuggestions.slice(0, 3));
    }, [nodes, edges]);

    if (suggestions.length === 0) return null;

    return (
        <div className="space-y-1.5">
            {suggestions.map((sugg) => (
                <button
                    key={sugg.id}
                    onClick={() => onConnectNodes(sugg.sourceId, sugg.targetType)}
                    className="flex items-center gap-2.5 p-2.5 w-full text-left bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:border-amber-300 transition-all group animate-in slide-in-from-left-4 fade-in duration-300"
                >
                    <span className="bg-white p-1 rounded-md shadow-sm group-hover:scale-110 transition-transform">
                        {sugg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-800 truncate">{sugg.title}</span>
                            <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-amber-900 border border-amber-100">AI</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-amber-700">{sugg.actionLabel}</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
