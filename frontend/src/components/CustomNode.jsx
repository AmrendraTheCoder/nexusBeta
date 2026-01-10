import React from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  Cloud, GitBranch, Repeat, Zap, X, Target, Wallet, Bug, Send,
  Brain, Eye, Shield, TrendingUp, Percent, AlertTriangle, CheckCircle,
  XCircle, DollarSign, BarChart3, Globe, Newspaper
} from "lucide-react";

// Extended icon mapping for all node types
const icons = {
  "pyth-network": <Cloud size={16} className="text-blue-500" />,
  limitOrder: <Target size={16} className="text-purple-500" />,
  queryBalance: <Wallet size={16} className="text-green-500" />,
  sendToken: <Send size={16} className="text-orange-500" />,
  condition: <GitBranch size={16} className="text-yellow-500" />,
  swap: <Repeat size={16} className="text-cyan-500" />,
  print: <Bug size={16} className="text-gray-500" />,
  // AI Trading nodes
  aiPrediction: <Brain size={16} className="text-purple-500" />,
  tradingAgent: <TrendingUp size={16} className="text-blue-500" />,
  visionAnalysis: <Eye size={16} className="text-violet-500" />,
  newsPrediction: <Newspaper size={16} className="text-orange-500" />,
  stopLoss: <AlertTriangle size={16} className="text-red-500" />,
  riskManager: <Shield size={16} className="text-amber-500" />,
  // DeFi Yield nodes
  apyMonitor: <Percent size={16} className="text-green-500" />,
  yieldOptimizer: <BarChart3 size={16} className="text-emerald-500" />,
  // Trust & Safety nodes
  maxInvestment: <DollarSign size={16} className="text-yellow-500" />,
  dailyLossLimit: <AlertTriangle size={16} className="text-orange-500" />,
  userConfirmation: <CheckCircle size={16} className="text-blue-500" />,
  // Nexus nodes
  nexusPay: <DollarSign size={16} className="text-green-500" />,
  registryQuery: <Cloud size={16} className="text-blue-500" />,
  // Arbitrage nodes
  arbitrage: <Repeat size={16} className="text-purple-500" />,
  crossChainArbitrage: <Globe size={16} className="text-blue-500" />,
  default: <Zap size={16} className="text-slate-500" />,
};

// Node category colors
const categoryColors = {
  "pyth-network": { bg: "bg-blue-50", border: "border-blue-300", header: "bg-blue-100" },
  condition: { bg: "bg-yellow-50", border: "border-yellow-300", header: "bg-yellow-100" },
  swap: { bg: "bg-cyan-50", border: "border-cyan-300", header: "bg-cyan-100" },
  sendToken: { bg: "bg-orange-50", border: "border-orange-300", header: "bg-orange-100" },
  // AI nodes - purple theme
  aiPrediction: { bg: "bg-purple-50", border: "border-purple-300", header: "bg-purple-100" },
  tradingAgent: { bg: "bg-blue-50", border: "border-blue-300", header: "bg-blue-100" },
  visionAnalysis: { bg: "bg-violet-50", border: "border-violet-300", header: "bg-violet-100" },
  newsPrediction: { bg: "bg-orange-50", border: "border-orange-300", header: "bg-orange-100" },
  // Risk nodes - amber/red theme
  stopLoss: { bg: "bg-red-50", border: "border-red-300", header: "bg-red-100" },
  riskManager: { bg: "bg-amber-50", border: "border-amber-300", header: "bg-amber-100" },
  // DeFi nodes - green theme
  apyMonitor: { bg: "bg-green-50", border: "border-green-300", header: "bg-green-100" },
  yieldOptimizer: { bg: "bg-emerald-50", border: "border-emerald-300", header: "bg-emerald-100" },
  // Arbitrage nodes - purple theme
  arbitrage: { bg: "bg-purple-50", border: "border-purple-300", header: "bg-purple-100" },
  crossChainArbitrage: { bg: "bg-blue-50", border: "border-blue-300", header: "bg-blue-100" },
  // Default
  default: { bg: "bg-white", border: "border-slate-300", header: "bg-slate-50" },
};

function CustomNode({ data, isConnectable, selected, id }) {
  const { setNodes, setEdges } = useReactFlow();
  const icon = icons[data.type] || icons.default;
  const colors = categoryColors[data.type] || categoryColors.default;

  // Execution states
  const isExecuting = data.isExecuting;
  const executionStatus = data.executionStatus; // 'running', 'success', 'error'
  const hasOutput = data.hasOutput;

  // Dynamic styling based on execution state
  let borderClass = colors.border;
  let bgClass = colors.bg;
  let headerClass = colors.header;
  let glowClass = "";
  let pulseClass = "";
  let statusClass = "";

  if (isExecuting) {
    borderClass = "border-blue-500 border-4";
    bgClass = "bg-blue-50";
    headerClass = "bg-blue-100";
    glowClass = "shadow-2xl shadow-blue-500/70 animate-pulse";
    pulseClass = "animate-pulse";
    statusClass = "node-running";
  } else if (executionStatus === "success") {
    borderClass = "border-green-500 border-3";
    bgClass = "bg-gradient-to-br from-green-50 to-emerald-50";
    glowClass = "shadow-lg shadow-green-500/50";
    statusClass = "node-completed";
  } else if (executionStatus === "error") {
    borderClass = "border-red-500 border-2";
    glowClass = "shadow-md shadow-red-400/30";
  } else if (selected) {
    borderClass = "border-violet-500 border-3";
    glowClass = "shadow-lg shadow-violet-400/40";
  }

  // Get the inputs and outputs
  const inputs = Object.entries(data.inputs || {});
  const outputs = Object.entries(data.outputs || {});

  const baseTopOffset = 70;
  const handleSpacing = 25;

  const onDelete = (e) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== id && edge.target !== id)
    );
  };

  return (
    <div
      className={`${bgClass} rounded-lg border-2 ${borderClass} ${glowClass} ${pulseClass} ${statusClass} w-64 transition-all duration-300`}
      data-executing={isExecuting}
      data-status={executionStatus}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-2 border-b border-slate-200 ${headerClass} rounded-t-lg`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${isExecuting ? 'bg-green-200' : 'bg-white/50'}`}>
            {icon}
          </div>
          <div className="font-bold text-sm truncate max-w-[140px]">{data.label}</div>
        </div>
        <div className="flex items-center gap-1">
          {/* Execution Status Indicator */}
          {isExecuting && (
            <div className="flex items-center gap-1 mr-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
          )}
          {executionStatus === "success" && !isExecuting && (
            <CheckCircle size={14} className="text-green-500 mr-1" />
          )}
          {executionStatus === "error" && !isExecuting && (
            <XCircle size={14} className="text-red-500 mr-1" />
          )}
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
            title="Delete node"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{data.type}</span>
          {hasOutput && (
            <span className="text-green-600 font-medium">✓ Output</span>
          )}
        </div>

        {/* Show key node_data values */}
        {data.node_data && (
          <div className="mt-2 space-y-1">
            {data.node_data.symbol && (
              <div className="flex justify-between">
                <span className="text-slate-400">Symbol:</span>
                <span className="font-medium text-slate-700">{data.node_data.symbol}</span>
              </div>
            )}
            {data.node_data.asset && (
              <div className="flex justify-between">
                <span className="text-slate-400">Asset:</span>
                <span className="font-medium text-slate-700">{data.node_data.asset}</span>
              </div>
            )}
            {data.node_data.strategy && (
              <div className="flex justify-between">
                <span className="text-slate-400">Strategy:</span>
                <span className="font-medium text-slate-700">{data.node_data.strategy}</span>
              </div>
            )}
            {data.node_data.condition && (
              <div className="flex justify-between">
                <span className="text-slate-400">Condition:</span>
                <span className="font-mono text-slate-700 text-[10px]">{data.node_data.condition}</span>
              </div>
            )}
          </div>
        )}

        {/* Execution message */}
        {isExecuting && (
          <div className="mt-2 bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded animate-pulse">
            ⚡ Executing...
          </div>
        )}
      </div>

      {/* Input Handles */}
      {inputs.map(([key], index) => (
        <Handle
          key={`input-${key}`}
          type="target"
          position={Position.Left}
          id={key}
          style={{
            top: `${baseTopOffset + index * handleSpacing}px`,
            background: isExecuting ? '#22c55e' : '#94a3b8',
            width: 10,
            height: 10,
            border: '2px solid white',
          }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Output Handles */}
      {outputs.map(([key], index) => (
        <Handle
          key={`output-${key}`}
          type="source"
          position={Position.Right}
          id={key}
          style={{
            top: `${baseTopOffset + index * handleSpacing}px`,
            background: hasOutput ? '#22c55e' : '#94a3b8',
            width: 10,
            height: 10,
            border: '2px solid white',
          }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Money Flow Animation Overlay */}
      {isExecuting && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-flow" />
        </div>
      )}
    </div>
  );
}

export default React.memo(CustomNode);
