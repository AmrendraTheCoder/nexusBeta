import React, { useState, useRef, useCallback } from "react";
import {
  Cloud,
  GitBranch,
  Repeat,
  Bug,
  Play,
  FileText,
  Send,
  Target,
  Wallet,
  Lock,
  List,
  ChevronDown,
  ChevronRight,
  Zap,
  Brain,
  Sparkles,
  HeartPulse,
  Shield,
  ArrowRightLeft,
  Globe,
  Loader,
  Eye,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Bot,
  GripVertical,
  Newspaper,
} from "lucide-react";
import TemplateModal from "./TemplateModal";
import SuggestionPanel from "./SuggestionPanel";

// ============ WEB3 WORKFLOW NODES ============
const defiNodes = [
  { type: "pyth-network", label: "Pyth Price Feed", icon: <Cloud size={18} /> },
  { type: "limitOrder", label: "1inch Limit Order", icon: <Target size={18} /> },
  { type: "queryBalance", label: "Query Balance", icon: <Wallet size={18} /> },
  { type: "sendToken", label: "Send Token", icon: <Send size={18} /> },
  { type: "condition", label: "Condition", icon: <GitBranch size={18} /> },
  { type: "swap", label: "Swap", icon: <Repeat size={18} /> },
  { type: "print", label: "Print Debug", icon: <Bug size={18} /> },
];

const nexusNodes = [
  { type: "nexusPay", label: "Nexus Pay (402 API)", icon: <Lock size={18} />, accent: "purple" },
  { type: "registryQuery", label: "Service Registry", icon: <List size={18} />, accent: "blue" },
];

const riskNodes = [
  { type: "healthFactor", label: "Health Factor", icon: <HeartPulse size={18} />, accent: "red" },
  { type: "autoRepay", label: "Auto Repay", icon: <Shield size={18} />, accent: "red" },
  { type: "liquidationAlert", label: "Liquidation Alert", icon: <Shield size={18} />, accent: "orange" },
];

const crossChainNodes = [
  { type: "crossChainTrigger", label: "Cross-Chain Trigger", icon: <Globe size={18} />, accent: "blue" },
  { type: "crossChainSwap", label: "Cross-Chain Swap", icon: <ArrowRightLeft size={18} />, accent: "blue" },
];

// ============ AI TRADING NODES ============
const aiAnalysisNodes = [
  { type: "tradingAgent", label: "AI Trading Agent", icon: <Brain size={18} />, accent: "emerald" },
  { type: "visionAnalysis", label: "Vision Analysis", icon: <Eye size={18} />, accent: "purple" },
  { type: "aiPrediction", label: "AI Prediction", icon: <Sparkles size={18} />, accent: "amber" },
  { type: "newsPrediction", label: "News + Pattern Prediction", icon: <Newspaper size={18} />, accent: "orange", description: "News sentiment + historical patterns" },
];

const tradeExecutionNodes = [
  { type: "swap", label: "Execute Trade", icon: <Repeat size={18} />, accent: "blue" },
  { type: "limitOrder", label: "Limit Order", icon: <Target size={18} />, accent: "blue" },
  { type: "condition", label: "Trade Condition", icon: <GitBranch size={18} />, accent: "slate" },
];

const tradingRiskNodes = [
  { type: "stopLoss", label: "Stop-Loss Monitor", icon: <AlertTriangle size={18} />, accent: "red" },
  { type: "riskManager", label: "Risk Manager", icon: <Shield size={18} />, accent: "orange" },
];

const marketDataNodes = [
  { type: "pyth-network", label: "Price Feed", icon: <BarChart3 size={18} />, accent: "cyan" },
  { type: "queryBalance", label: "Portfolio Balance", icon: <Wallet size={18} />, accent: "green" },
];

// ============ DEFI YIELD NODES ============
const defiYieldNodes = [
  {
    type: "apyMonitor",
    label: "APY Monitor",
    icon: <TrendingUp size={18} />,
    accent: "green",
    description: "Scan DeFi protocols for best yields"
  },
  {
    type: "yieldOptimizer",
    label: "Yield Optimizer Agent",
    icon: <Bot size={18} />,
    accent: "emerald",
    description: "AI-powered yield rebalancing"
  },
];

// ============ ARBITRAGE NODES ============
const arbitrageNodes = [
  {
    type: "arbitrage",
    label: "DEX Arbitrage Scanner",
    icon: <Repeat size={18} />,
    accent: "purple",
    description: "Find arbitrage across DEXs"
  },
  {
    type: "crossChainArbitrage",
    label: "Cross-Chain Arbitrage",
    icon: <Globe size={18} />,
    accent: "blue",
    description: "Multi-chain price arbitrage"
  },
];

// ============ TRUST & SAFETY NODES (COMPULSORY) ============
const trustSafetyNodes = [
  {
    type: "maxInvestment",
    label: "Max Investment Limit",
    icon: <ShieldCheck size={18} />,
    accent: "emerald",
    required: true,
    description: "Set maximum amount per trade"
  },
  {
    type: "dailyLossLimit",
    label: "Daily Loss Limit",
    icon: <Shield size={18} />,
    accent: "red",
    required: true,
    description: "Maximum daily loss allowed"
  },
  {
    type: "userConfirmation",
    label: "User Confirmation",
    icon: <UserCheck size={18} />,
    accent: "blue",
    required: true,
    description: "Require user approval for trades"
  },
];


function CollapsibleSection({ title, icon, children, defaultOpen = true, accentColor = "slate", badge }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 rounded-lg text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</span>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="pt-2 space-y-1.5">{children}</div>
      </div>
    </div>
  );
}

function NodeButton({ node, onAdd }) {
  const accentStyles = {
    purple: "hover:bg-purple-50 hover:border-purple-300",
    blue: "hover:bg-blue-50 hover:border-blue-300",
    emerald: "hover:bg-emerald-50 hover:border-emerald-300",
    amber: "hover:bg-amber-50 hover:border-amber-300",
    red: "hover:bg-red-50 hover:border-red-300",
    orange: "hover:bg-orange-50 hover:border-orange-300",
    cyan: "hover:bg-cyan-50 hover:border-cyan-300",
    green: "hover:bg-green-50 hover:border-green-300",
    slate: "hover:bg-slate-50 hover:border-slate-300",
    default: "hover:bg-violet-50 hover:border-violet-300",
  };

  const iconColors = {
    purple: "text-purple-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
    orange: "text-orange-500",
    cyan: "text-cyan-500",
    green: "text-green-500",
    slate: "text-slate-500",
  };

  const style = accentStyles[node.accent] || accentStyles.default;
  const iconColor = iconColors[node.accent] || "text-violet-500";

  return (
    <button
      onClick={() => onAdd(node.type)}
      className={`flex items-center gap-2.5 p-2.5 w-full text-left bg-white border border-slate-200 rounded-lg transition-all duration-150 group ${style}`}
    >
      <span className={`${iconColor} group-hover:scale-110 transition-transform`}>
        {node.icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          {node.label}
          {node.required && <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-600 rounded font-bold">REQUIRED</span>}
        </span>
        {node.description && (
          <p className="text-[10px] text-slate-400 truncate">{node.description}</p>
        )}
      </div>
    </button>
  );
}

export default function Sidebar({
  onAddNode,
  onExecuteWorkflow,
  onLoadTemplate,
  nodes,
  edges,
  onConnectSuggestion,
  onGenerateWorkflow,
  workflowType = "once",
  setWorkflowType,
  appMode = "web3",
  setAppMode,
}) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isResizing = useRef(false);

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    setIsTemplateModalOpen(false);
  };

  const handleGenerateFromPrompt = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);

    // Use environment variable or fallback to localhost
    const backendUrl = import.meta.env.VITE_NEXUS_BACKEND_URL || "http://localhost:3001";

    try {
      const response = await fetch(`${backendUrl}/api/ai/generate-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, mode: appMode }),
      });
      const result = await response.json();
      if (result.success && onGenerateWorkflow) {
        onGenerateWorkflow(result.workflow);
        setAiPrompt("");
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
    e.preventDefault();
  }, []);

  const resize = useCallback((e) => {
    if (isResizing.current) {
      const newWidth = Math.min(Math.max(e.clientX, 220), 400);
      setSidebarWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  }, [resize]);

  const isAIMode = appMode === "trading";

  return (
    <>
      <aside
        style={{ width: sidebarWidth }}
        className={`relative p-4 border-r flex flex-col overflow-y-auto ${isAIMode
          ? "bg-gradient-to-b from-emerald-50/50 to-white border-emerald-200"
          : "bg-gradient-to-b from-violet-50/50 to-white border-slate-200"
          }`}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-violet-400 transition-colors group z-10"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={12} className="text-slate-400" />
          </div>
        </div>

        {/* Mode Switcher - Hidden (keeping logic for future use) */}
        {/* <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Workflow Mode</p>
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setAppMode?.("web3")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${!isAIMode
                ? "bg-white text-violet-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Zap size={14} />
              Web3
            </button>
            <button
              onClick={() => setAppMode?.("trading")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${isAIMode
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Bot size={14} />
              AI Trading
            </button>
          </div>
        </div> */}

        {/* AI Prompt Input */}
        <div className={`mb-4 p-3 rounded-xl border ${isAIMode
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
          : "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200"
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className={isAIMode ? "text-emerald-600" : "text-violet-600"} />
            <span className={`text-sm font-semibold ${isAIMode ? "text-emerald-700" : "text-violet-700"}`}>
              {isAIMode ? "AI Strategy" : "Text-to-DeFi"}
            </span>
            <Sparkles size={12} className="text-amber-500" />
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={isAIMode
              ? "Create a BTC trading bot with 5% stop-loss..."
              : "Buy ETH when price drops below $3000..."
            }
            className={`w-full p-2 text-xs rounded-lg resize-none focus:ring-2 bg-white ${isAIMode
              ? "border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
              : "border-violet-200 focus:ring-violet-400 focus:border-violet-400"
              }`}
            rows={2}
          />
          <button
            onClick={handleGenerateFromPrompt}
            disabled={isGenerating || !aiPrompt.trim()}
            className={`mt-2 w-full flex items-center justify-center gap-2 py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all ${isAIMode
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              : "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              }`}
          >
            {isGenerating ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* ============ AI TRADING MODE ============ */}
        {isAIMode ? (
          <>
            {/* Trust & Safety - COMPULSORY */}
            <CollapsibleSection
              title="Trust & Safety"
              icon={<ShieldCheck size={16} className="text-emerald-500" />}
              defaultOpen={true}
              badge="REQUIRED"
            >
              {trustSafetyNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* AI Analysis */}
            <CollapsibleSection
              title="AI Analysis"
              icon={<Brain size={16} className="text-emerald-500" />}
              defaultOpen={true}
              accentColor="emerald"
            >
              {aiAnalysisNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Trade Execution */}
            <CollapsibleSection
              title="Trade Execution"
              icon={<Repeat size={16} className="text-blue-500" />}
              defaultOpen={true}
              accentColor="blue"
            >
              {tradeExecutionNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Risk Management */}
            <CollapsibleSection
              title="Risk Management"
              icon={<Shield size={16} className="text-red-500" />}
              defaultOpen={true}
              accentColor="red"
            >
              {tradingRiskNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Market Data */}
            <CollapsibleSection
              title="Market Data"
              icon={<BarChart3 size={16} className="text-cyan-500" />}
              defaultOpen={false}
              accentColor="cyan"
            >
              {marketDataNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* DeFi Yield Optimization */}
            <CollapsibleSection
              title="DeFi Yield"
              icon={<TrendingUp size={16} className="text-green-500" />}
              defaultOpen={true}
              accentColor="green"
            >
              {defiYieldNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Arbitrage */}
            <CollapsibleSection
              title="Arbitrage"
              icon={<Repeat size={16} className="text-purple-500" />}
              defaultOpen={true}
              accentColor="purple"
            >
              {arbitrageNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>
          </>
        ) : (
          <>
            {/* ============ WEB3 WORKFLOW MODE ============ */}
            {/* DeFi Nodes */}
            <CollapsibleSection
              title="DeFi Nodes"
              icon={<Zap size={16} className="text-violet-500" />}
              defaultOpen={true}
            >
              {defiNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Risk Management */}
            <CollapsibleSection
              title="Risk Management"
              icon={<HeartPulse size={16} className="text-red-500" />}
              defaultOpen={false}
              accentColor="red"
            >
              {riskNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Cross-Chain */}
            <CollapsibleSection
              title="Cross-Chain"
              icon={<Globe size={16} className="text-blue-500" />}
              defaultOpen={false}
              accentColor="blue"
            >
              {crossChainNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Nexus Nodes */}
            <CollapsibleSection
              title="Nexus Nodes"
              icon={<Lock size={16} className="text-violet-500" />}
              defaultOpen={false}
              accentColor="purple"
            >
              {nexusNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* DeFi Yield - Also available in Web3 mode */}
            <CollapsibleSection
              title="DeFi Yield"
              icon={<TrendingUp size={16} className="text-green-500" />}
              defaultOpen={false}
              accentColor="green"
            >
              {defiYieldNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>

            {/* Arbitrage - Also available in Web3 mode */}
            <CollapsibleSection
              title="Arbitrage"
              icon={<Repeat size={16} className="text-purple-500" />}
              defaultOpen={false}
              accentColor="purple"
            >
              {arbitrageNodes.map((node) => (
                <NodeButton key={node.type} node={node} onAdd={onAddNode} />
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* AI Assistant */}
        <div className="mb-4">
          <SuggestionPanel nodes={nodes} edges={edges} onConnectNodes={onConnectSuggestion} />
        </div>

        {/* Templates */}
        <CollapsibleSection
          title="Templates"
          icon={<FileText size={16} className="text-green-500" />}
          defaultOpen={false}
        >
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2.5 p-2.5 w-full text-left bg-white border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all"
          >
            <FileText size={18} className="text-violet-500" />
            <span className="text-sm font-medium text-slate-700">Browse Templates</span>
          </button>
        </CollapsibleSection>

        {/* Execute Section */}
        <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
          {/* Execution Mode */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Execution Mode</p>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setWorkflowType?.("once")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${workflowType === "once"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Run Once
              </button>
              <button
                onClick={() => setWorkflowType?.("repeat")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${workflowType === "repeat"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Repeat
              </button>
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={onExecuteWorkflow}
            className={`flex items-center justify-center gap-2 p-3 w-full text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all group ${isAIMode
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              : "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              }`}
          >
            <Play size={18} className="group-hover:scale-110 transition-transform" />
            <span>{isAIMode ? "Start Trading" : "Execute Workflow"}</span>
          </button>
        </div>
      </aside >

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />
    </>
  );
}
