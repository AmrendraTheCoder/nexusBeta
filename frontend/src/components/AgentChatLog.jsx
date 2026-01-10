import React, { useState, useEffect, useRef } from "react";
import {
    Brain, Eye, Newspaper, TrendingUp, Shield, DollarSign,
    CheckCircle, MessageSquare, Sparkles, X, ChevronDown, ChevronUp
} from "lucide-react";

// Agent personas with their characteristics
const AGENT_PERSONAS = {
    "pyth-network": {
        name: "Price Oracle",
        emoji: "📊",
        color: "blue",
        icon: <Brain size={14} />,
        personality: "I fetch real-time price data from Pyth Network."
    },
    "visionAnalysis": {
        name: "Vision Agent",
        emoji: "👁️",
        color: "violet",
        icon: <Eye size={14} />,
        personality: "I analyze charts using AI vision to detect patterns."
    },
    "newsPrediction": {
        name: "News Agent",
        emoji: "📰",
        color: "orange",
        icon: <Newspaper size={14} />,
        personality: "I scan crypto news and predict market sentiment."
    },
    "tradingAgent": {
        name: "Trading Agent",
        emoji: "🤖",
        color: "emerald",
        icon: <TrendingUp size={14} />,
        personality: "I make trading decisions based on all inputs."
    },
    "riskManager": {
        name: "Risk Manager",
        emoji: "🛡️",
        color: "amber",
        icon: <Shield size={14} />,
        personality: "I ensure trades don't exceed risk limits."
    },
    "maxInvestment": {
        name: "Investment Guard",
        emoji: "💰",
        color: "yellow",
        icon: <DollarSign size={14} />,
        personality: "I enforce maximum investment limits."
    },
    "userConfirmation": {
        name: "Confirmation Agent",
        emoji: "✅",
        color: "green",
        icon: <CheckCircle size={14} />,
        personality: "I require human approval before execution."
    },
};

// Simulated agent messages based on node type
const generateAgentMessage = (nodeType, nodeData, status) => {
    const agent = AGENT_PERSONAS[nodeType] || { name: "Agent", emoji: "🤖", color: "slate" };

    const messages = {
        "pyth-network": {
            thinking: `Fetching ${nodeData?.symbol || 'BTC'} price from Pyth Network...`,
            success: `Current ${nodeData?.symbol || 'BTC'} price: $${(Math.random() * 10000 + 90000).toFixed(2)}`,
            analyzing: `Connecting to decentralized oracle network...`
        },
        "visionAnalysis": {
            thinking: `Analyzing chart patterns with Gemini Vision AI...`,
            success: `Detected: Bull flag pattern forming. RSI at 58. Confidence: 78%`,
            analyzing: `Processing candlestick formations and volume profile...`
        },
        "newsPrediction": {
            thinking: `Scanning latest crypto news from 5 sources...`,
            success: `Sentiment: BULLISH (+65). Key news: "Institutional buying increases"`,
            analyzing: `Matching news against historical price patterns...`
        },
        "tradingAgent": {
            thinking: `Evaluating signals from Vision and News agents...`,
            success: `Decision: BUY signal generated. Position size: 0.05 ETH`,
            analyzing: `Running strategy: ${nodeData?.strategy || 'ai-signal'}...`
        },
        "riskManager": {
            thinking: `Checking portfolio risk exposure...`,
            success: `✓ Risk check passed. Current exposure: 15% (max: 30%)`,
            analyzing: `Validating against ${nodeData?.maxOpenPositions || 3} position limit...`
        },
        "maxInvestment": {
            thinking: `Verifying investment limits...`,
            success: `✓ Amount within limits. Max per trade: ${nodeData?.maxAmountPerTrade || '0.1'} ETH`,
            analyzing: `Checking total exposure against ${nodeData?.maxTotalExposure || '0.5'} ETH cap...`
        },
        "userConfirmation": {
            thinking: `Preparing trade summary for user approval...`,
            success: `Awaiting user confirmation... (60s timeout)`,
            analyzing: `Compiling risk assessment and trade details...`
        },
    };

    const nodeMessages = messages[nodeType] || {
        thinking: `Processing...`,
        success: `Completed successfully`,
        analyzing: `Analyzing data...`
    };

    return {
        agent,
        message: nodeMessages[status] || nodeMessages.thinking,
        timestamp: new Date().toLocaleTimeString()
    };
};

export default function AgentChatLog({ nodes, isExecuting, currentNodeId, stayOpen = true }) {
    const [messages, setMessages] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasBeenOpened, setHasBeenOpened] = useState(false);
    const messagesEndRef = useRef(null);

    // Once opened, stay open (unless user manually minimizes)
    useEffect(() => {
        if (isExecuting && !hasBeenOpened) {
            setHasBeenOpened(true);
            setIsMinimized(false);
        }
    }, [isExecuting, hasBeenOpened]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Simulate agent messages during execution
    useEffect(() => {
        if (!isExecuting) return;

        // Initial message
        setMessages([{
            agent: { name: "System", emoji: "🚀", color: "purple" },
            message: "Multi-agent workflow initiated. Agents are collaborating...",
            timestamp: new Date().toLocaleTimeString(),
            type: "system"
        }]);

        // Simulate messages for each node
        const nodeList = nodes.filter(n => n.data?.type);
        let delay = 500;

        nodeList.forEach((node, index) => {
            // Thinking message
            setTimeout(() => {
                const msg = generateAgentMessage(node.data.type, node.data.node_data, "thinking");
                setMessages(prev => [...prev, { ...msg, type: "thinking", nodeId: node.id }]);
            }, delay);
            delay += 1000;

            // Analyzing message
            setTimeout(() => {
                const msg = generateAgentMessage(node.data.type, node.data.node_data, "analyzing");
                setMessages(prev => [...prev, { ...msg, type: "analyzing", nodeId: node.id }]);
            }, delay);
            delay += 1500;

            // Success message
            setTimeout(() => {
                const msg = generateAgentMessage(node.data.type, node.data.node_data, "success");
                setMessages(prev => [...prev, { ...msg, type: "success", nodeId: node.id }]);
            }, delay);
            delay += 500;
        });

        // Final message
        setTimeout(() => {
            setMessages(prev => [...prev, {
                agent: { name: "System", emoji: "✨", color: "green" },
                message: "All agents completed! Workflow executed successfully.",
                timestamp: new Date().toLocaleTimeString(),
                type: "complete"
            }]);
        }, delay + 500);

    }, [isExecuting, nodes]);

    const getColorClasses = (color) => {
        const colors = {
            blue: "bg-blue-100 text-blue-700 border-blue-200",
            violet: "bg-violet-100 text-violet-700 border-violet-200",
            orange: "bg-orange-100 text-orange-700 border-orange-200",
            emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
            amber: "bg-amber-100 text-amber-700 border-amber-200",
            yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
            green: "bg-green-100 text-green-700 border-green-200",
            purple: "bg-purple-100 text-purple-700 border-purple-200",
            slate: "bg-slate-100 text-slate-700 border-slate-200",
        };
        return colors[color] || colors.slate;
    };

    // Don't show empty state if we've been opened before (keep showing last messages)
    if (messages.length === 0 && !hasBeenOpened) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Agent Chat Log</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    Execute a workflow to see agents communicate...
                </p>
            </div>
        );
    }

    // If no messages but was opened before, show waiting state
    if (messages.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Agent Chat Log</span>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Ready</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    Waiting for next workflow execution...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-200 cursor-pointer"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Sparkles size={16} className="text-purple-600" />
                    </div>
                    <span className="font-semibold text-slate-800">Agent Collaboration Log</span>
                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                        {messages.length} messages
                    </span>
                </div>
                {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {/* Messages */}
            {!isMinimized && (
                <div className="max-h-64 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-2 animate-fadeIn ${msg.type === 'system' || msg.type === 'complete' ? 'justify-center' : ''}`}
                        >
                            {msg.type !== 'system' && msg.type !== 'complete' && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${getColorClasses(msg.agent.color)}`}>
                                    {msg.agent.emoji}
                                </div>
                            )}
                            <div className={`flex-1 ${msg.type === 'system' || msg.type === 'complete' ? 'text-center' : ''}`}>
                                {msg.type === 'system' || msg.type === 'complete' ? (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${msg.type === 'complete' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        <span>{msg.agent.emoji}</span>
                                        {msg.message}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-700">{msg.agent.name}</span>
                                            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                            {msg.type === 'thinking' && (
                                                <span className="flex items-center gap-1 text-[10px] text-amber-600">
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                    thinking
                                                </span>
                                            )}
                                            {msg.type === 'success' && (
                                                <CheckCircle size={12} className="text-green-500" />
                                            )}
                                        </div>
                                        <p className={`text-xs mt-0.5 ${msg.type === 'success' ? 'text-green-700 font-medium' : 'text-slate-600'
                                            }`}>
                                            {msg.message}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
}
