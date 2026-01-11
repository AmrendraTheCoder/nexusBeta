// src/App.jsx

import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import dagre from "dagre";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import { Save, X, Wallet, TrendingUp, Play } from "lucide-react";
import Sidebar from "./components/Sidebar";
import WorkflowCanvas from "./components/WorkflowCanvas";
import SettingsPanel from "./components/SettingsPanel";
import ViewWorkflows from "./components/ViewWorkflows";
import HypergraphSaver from "./components/HypergraphSaver";
import GlobalSettingsModal from "./components/GlobalSettingsModal";
import ExecutionLogsPanel, { useExecutionLogs } from "./components/ExecutionLogsPanel";
import ChartsPanel from "./components/ChartsPanel";
import NewsPanel from "./components/NewsPanel";
import ExportPanel from "./components/ExportPanel";
import MarketplacePanel from "./components/MarketplacePanel";
import DocsPanel from "./components/DocsPanel";
import FeaturesDropdown from "./components/FeaturesDropdown";
import ToolsDropdown from "./components/ToolsDropdown";
import SessionKeyPanel from "./components/SessionKeyPanel";
import AIAgentPanel from "./components/AIAgentPanel";
import LeaderboardPanel from "./components/LeaderboardPanel";
import DepositPanel from "./components/DepositPanel";
import TransactionDashboard from "./components/TransactionDashboard";
import LiveTradingDashboard from "./components/LiveTradingDashboard";
import AITradingPanel from "./components/AITradingPanel";
import CostEstimatorModal from "./components/CostEstimatorModal";
import ProviderLeaderboard from "./components/ProviderLeaderboard";
import ImportWorkflowModal from "./components/ImportWorkflowModal";
import WorkflowResultModal from "./components/WorkflowResultModal";
import TradingExecutionPage from "./components/TradingExecutionPage";
import WorkflowPortfolio from "./components/WorkflowPortfolio";
import AIDecisionPanel from "./components/AIDecisionPanel";
import AgentChatLog from "./components/AgentChatLog";
import LiveTradingChart from "./components/LiveTradingChart";



// Import wagmi hooks
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";

// Import node configuration
import { NODE_CONFIG, getNodeConfigForChain } from "./config/nodeConfig";

// Import custom hooks
import { useWorkflowExecution } from "./hooks/useWorkflowExecution";
import { useNodeStatus } from "./hooks/useNodeStatus";

let id = 1;
const getId = () => `${id++}`;

// --- Wallet Connection Component ---
function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-3 py-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <p className="text-slate-700 text-sm font-mono">
          {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
        </p>
        <button
          onClick={() => disconnect()}
          className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Disconnect"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: metaMask() })}
      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2 px-4 rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg transition-all"
    >
      <Wallet size={18} />
      Connect
    </button>
  );
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState("My Arbitrage Workflow");
  const [workflowType, setWorkflowType] = useState("once");
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSessionKeysOpen, setIsSessionKeysOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isTransactionDashboardOpen, setIsTransactionDashboardOpen] = useState(false);
  const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState(false);
  const [isProviderLeaderboardOpen, setIsProviderLeaderboardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Modal state
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [workflowResultData, setWorkflowResultData] = useState(null); // Store workflow result
  const [isLiveTradingOpen, setIsLiveTradingOpen] = useState(false);
  const [isAITradingPanelOpen, setIsAITradingPanelOpen] = useState(false);
  const [isAIDecisionPanelOpen, setIsAIDecisionPanelOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  // Default to AI Trading mode (web3 logic kept for future)
  const [appMode, setAppMode] = useState(() => {
    const saved = localStorage.getItem("nexus_app_mode");
    return "trading"; // Always default to trading mode
  });

  // Save appMode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("nexus_app_mode", appMode);
    console.log(`[App] Mode changed to: ${appMode}`);
  }, [appMode]);

  const { address, isConnected, chain } = useAccount();
  const { executeWorkflow } = useWorkflowExecution();
  const { currentExecutingNode, workflowCompleted } = useNodeStatus(address);
  const { logs, isExecuting, addLog, clearLogs, startExecution, endExecution } = useExecutionLogs();

  // Trigger confetti when workflow completes
  useEffect(() => {
    const handleWorkflowComplete = (event) => {
      console.log("🎉 Workflow completed event received! showing result page...");

      // Store workflow result data
      if (event?.detail) {
        setWorkflowResultData(event.detail);
      } else if (logs && logs.length > 0) {
        setWorkflowResultData(logs[logs.length - 1]);
      }

      setIsResultModalOpen(true);

      // Create a spectacular confetti effect
      const duration = 3000; // 3 seconds
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Multiple bursts from different positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    };

    window.addEventListener('workflowCompleted', handleWorkflowComplete);

    // Also check the hook state (legacy)
    if (workflowCompleted) {
      handleWorkflowComplete();
    }

    return () => {
      window.removeEventListener('workflowCompleted', handleWorkflowComplete);
    };
  }, [workflowCompleted]);

  // Track executed nodes for visual feedback
  const [executedNodes, setExecutedNodes] = useState(new Set());
  const [currentlyExecutingNode, setCurrentlyExecutingNode] = useState(null);

  // Listen for workflow logs and update node execution status
  useEffect(() => {
    const handleWorkflowLogs = (event) => {
      const { logs: backendLogs, isRunning } = event.detail;

      if (!backendLogs || backendLogs.length === 0) return;

      // Find currently executing and completed nodes from logs
      const completed = new Set();
      let executing = null;

      backendLogs.forEach(log => {
        if (log.message?.includes('Node execution completed') || log.type === 'success') {
          completed.add(log.nodeId);
        }
        if (log.message?.includes('Executing node') && isRunning) {
          executing = log.nodeId;
        }
      });

      setExecutedNodes(completed);
      setCurrentlyExecutingNode(isRunning ? executing : null);

      // Update nodes with execution status
      setNodes(nds => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: node.id === executing && isRunning,
          executionStatus: completed.has(node.id) ? 'success' : (node.id === executing ? 'running' : null),
          hasOutput: completed.has(node.id)
        }
      })));
    };

    const handleWorkflowComplete = () => {
      // Mark all nodes as completed when workflow finishes
      setCurrentlyExecutingNode(null);
      setNodes(nds => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: false,
          executionStatus: 'success',
          hasOutput: true
        }
      })));
    };

    window.addEventListener('workflowLogs', handleWorkflowLogs);
    window.addEventListener('workflowCompleted', handleWorkflowComplete);

    return () => {
      window.removeEventListener('workflowLogs', handleWorkflowLogs);
      window.removeEventListener('workflowCompleted', handleWorkflowComplete);
    };
  }, [setNodes]);

  // Reset node status when starting new execution
  useEffect(() => {
    if (isExecuting) {
      setExecutedNodes(new Set());
      setNodes(nds => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: false,
          executionStatus: null,
          hasOutput: false
        }
      })));
    }
  }, [isExecuting, setNodes]);

  // --- Workflow Caching: Save to localStorage with 5-minute TTL ---
  const CACHE_KEY = 'nexus_workflow_cache';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Load workflow from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { nodes: cachedNodes, edges: cachedEdges, name, type, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Only load if cache is fresh (< 5 minutes old)
        if (age < CACHE_TTL_MS && cachedNodes?.length > 0) {
          console.log(`📂 [Cache] Loading workflow from cache (${Math.round(age / 1000)}s old)`);

          // Sanitize loaded nodes to ensure they have valid positions
          const sanitizedNodes = cachedNodes.map(node => ({
            ...node,
            position: (node.position && typeof node.position.x === 'number')
              ? node.position
              : { x: Math.random() * 400, y: Math.random() * 400 }
          }));

          setNodes(sanitizedNodes);
          setEdges(cachedEdges || []);
          if (name) setWorkflowName(name);
          if (type) setWorkflowType(type);
        } else {
          console.log('📂 [Cache] Cache expired or empty, starting fresh');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (e) {
      console.warn('[Cache] Failed to load cached workflow:', e);
    }
  }, []); // Only run on mount

  // Save workflow to cache on change (debounced to avoid excessive saves during execution)
  useEffect(() => {
    // Don't save empty workflows
    if (nodes.length === 0 && edges.length === 0) return;

    // Debounce cache saves to avoid excessive writes during execution
    const timeoutId = setTimeout(() => {
      try {
        // Strip execution status from nodes before caching
        const cleanNodes = nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isExecuting: undefined,
            executionStatus: undefined,
            hasOutput: undefined
          }
        }));

        const cacheData = {
          nodes: cleanNodes,
          edges,
          name: workflowName,
          type: workflowType,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        // Reduce log noise - only log occasionally
        if (Math.random() < 0.1) {
          console.log(`💾 [Cache] Workflow saved (${nodes.length} nodes, ${edges.length} edges)`);
        }
      } catch (e) {
        console.warn('[Cache] Failed to save workflow:', e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, workflowName, workflowType]);

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      let edgeParams = { ...params };

      if (sourceNode && sourceNode.data.type === "condition") {
        if (params.sourceHandle === "true-path") {
          edgeParams.label = "True";
        } else if (params.sourceHandle === "false-path") {
          edgeParams.label = "False";
        }
      }

      setEdges((eds) => addEdge(edgeParams, eds));
    },
    [nodes, setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Demo Mode - Pre-built workflow for judges to test quickly
  const loadDemoWorkflow = useCallback(() => {
    const demoNodes = [
      { id: "demo-1", type: "custom", position: { x: 100, y: 150 }, data: { label: "Pyth ETH/USD Price", type: "pyth-network", inputs: {}, outputs: { price: { type: "float" } }, node_data: { symbol: "ETH_USD" } } },
      { id: "demo-2", type: "custom", position: { x: 400, y: 100 }, data: { label: "x402 Payment Gate", type: "nexusPay", inputs: { trigger: { type: "any" } }, outputs: { data: { type: "json" } }, node_data: { api_url: "http://localhost:3001/api/premium-data" } } },
      { id: "demo-3", type: "custom", position: { x: 400, y: 250 }, data: { label: "Price > $3000?", type: "condition", inputs: { price: { type: "float" } }, outputs: { "true": { type: "bool" }, "false": { type: "bool" } }, node_data: { condition: "price > 3000" } } },
      { id: "demo-4", type: "custom", position: { x: 700, y: 100 }, data: { label: "Swap USDC → ETH", type: "swap", inputs: { activate: { type: "bool" } }, outputs: { tx: { type: "string" } }, node_data: { from: "USDC", to: "ETH", amount: "100" } } },
      { id: "demo-5", type: "custom", position: { x: 700, y: 250 }, data: { label: "Hold Position", type: "condition", inputs: {}, outputs: {}, node_data: {} } },
    ];
    const demoEdges = [
      { id: "demo-e1", source: "demo-1", target: "demo-2", type: "default" },
      { id: "demo-e2", source: "demo-1", target: "demo-3", type: "default" },
      { id: "demo-e3", source: "demo-2", target: "demo-4", type: "default" },
      { id: "demo-e4", source: "demo-3", target: "demo-5", type: "default" },
    ];
    setNodes(demoNodes);
    setEdges(demoEdges);
    setWorkflowName("AI Trading with x402 Payments");
  }, [setNodes, setEdges]);

  // 🚀 ONE-CLICK DEMO: Multi-Agent AI Trading Workflow
  // This showcases the agentic nature of the platform for hackathon judges
  const loadAgenticDemo = useCallback(() => {
    console.log("🚀 Loading Agentic AI Trading Demo...");

    const demoNodes = [
      // Row 1: Data Sources
      {
        id: "agent-price",
        type: "custom",
        position: { x: 50, y: 100 },
        data: {
          label: "📊 Live BTC Price",
          type: "pyth-network",
          inputs: {},
          outputs: { price: { type: "float" } },
          node_data: { symbol: "BTC_USD" }
        }
      },

      // Row 2: AI Analysis Agents (The "Agentic" Part!)
      {
        id: "agent-vision",
        type: "custom",
        position: { x: 300, y: 50 },
        data: {
          label: "👁️ Vision Agent",
          type: "visionAnalysis",
          inputs: { price: { type: "float" } },
          outputs: {
            analysis: { type: "string" },
            sentiment: { type: "string" },
            confidence: { type: "float" },
            suggestedAction: { type: "string" }
          },
          node_data: {
            prompt: "Analyze BTC chart patterns and provide trading signal",
            persona: "default",
            analysisType: "chart",
            apiProvider: "gemini"
          }
        }
      },
      {
        id: "agent-news",
        type: "custom",
        position: { x: 300, y: 200 },
        data: {
          label: "📰 News Agent",
          type: "newsPrediction",
          inputs: { activate: { type: "bool" } },
          outputs: {
            sentiment: { type: "string" },
            signal: { type: "string" },
            confidence: { type: "float" },
            predictedMove: { type: "float" }
          },
          node_data: {
            symbol: "BTC",
            newsSource: "aggregated",
            lookbackHours: 24,
            includePatternAnalysis: true
          }
        }
      },

      // Row 3: Decision Making Agent
      {
        id: "agent-trader",
        type: "custom",
        position: { x: 550, y: 125 },
        data: {
          label: "🤖 Trading Agent",
          type: "tradingAgent",
          inputs: {
            prediction: { type: "object" },
            price: { type: "float" }
          },
          outputs: {
            signal: { type: "object" },
            action: { type: "string" },
            shouldTrade: { type: "bool" },
            positionSize: { type: "string" }
          },
          node_data: {
            symbol: "BTC",
            strategy: "ai-signal",
            riskLevel: "moderate",
            maxPositionSize: "0.1",
            stopLossPercent: 5,
            takeProfitPercent: 10
          }
        }
      },

      // Row 4: Safety & Risk (REQUIRED - Shows Responsible AI)
      {
        id: "agent-risk",
        type: "custom",
        position: { x: 800, y: 50 },
        data: {
          label: "🛡️ Risk Manager",
          type: "riskManager",
          inputs: {
            signal: { type: "object" },
            trade: { type: "object" }
          },
          outputs: {
            approved: { type: "bool" },
            adjustedSize: { type: "string" },
            reason: { type: "string" }
          },
          node_data: {
            maxPortfolioRisk: 30,
            maxSinglePositionSize: 10,
            maxDailyLoss: 5,
            maxOpenPositions: 3
          }
        }
      },
      {
        id: "agent-limit",
        type: "custom",
        position: { x: 800, y: 200 },
        data: {
          label: "💰 Max Investment",
          type: "maxInvestment",
          inputs: { activate: { type: "bool" } },
          outputs: {
            approved: { type: "bool" },
            adjustedAmount: { type: "string" }
          },
          node_data: {
            maxAmountPerTrade: "0.05",
            maxTotalExposure: "0.2",
            currency: "ETH",
            enforceLimit: true
          }
        }
      },

      // Row 5: Execution
      {
        id: "agent-confirm",
        type: "custom",
        position: { x: 1050, y: 125 },
        data: {
          label: "✅ User Confirm",
          type: "userConfirmation",
          inputs: {
            trade: { type: "object" },
            signal: { type: "object" }
          },
          outputs: {
            confirmed: { type: "bool" }
          },
          node_data: {
            requireConfirmation: true,
            confirmationMethod: "popup",
            timeoutSeconds: 60,
            minConfirmationDelay: 3
          }
        }
      },
    ];

    const demoEdges = [
      // Price feeds into Vision and News agents
      { id: "e-price-vision", source: "agent-price", target: "agent-vision", sourceHandle: "price", targetHandle: "price", animated: true, style: { stroke: '#8b5cf6' } },
      { id: "e-price-news", source: "agent-price", target: "agent-news", sourceHandle: "price", targetHandle: "activate", animated: true, style: { stroke: '#8b5cf6' } },

      // Vision and News feed into Trading Agent
      { id: "e-vision-trader", source: "agent-vision", target: "agent-trader", sourceHandle: "analysis", targetHandle: "prediction", animated: true, style: { stroke: '#10b981' } },
      { id: "e-news-trader", source: "agent-news", target: "agent-trader", sourceHandle: "signal", targetHandle: "price", animated: true, style: { stroke: '#f59e0b' } },

      // Trading Agent feeds into Risk checks
      { id: "e-trader-risk", source: "agent-trader", target: "agent-risk", sourceHandle: "signal", targetHandle: "signal", animated: true, style: { stroke: '#ef4444' } },
      { id: "e-trader-limit", source: "agent-trader", target: "agent-limit", sourceHandle: "shouldTrade", targetHandle: "activate", animated: true, style: { stroke: '#ef4444' } },

      // Risk checks feed into User Confirmation
      { id: "e-risk-confirm", source: "agent-risk", target: "agent-confirm", sourceHandle: "approved", targetHandle: "trade", animated: true, style: { stroke: '#3b82f6' } },
      { id: "e-limit-confirm", source: "agent-limit", target: "agent-confirm", sourceHandle: "approved", targetHandle: "signal", animated: true, style: { stroke: '#3b82f6' } },
    ];

    setNodes(demoNodes);
    setEdges(demoEdges);
    setWorkflowName("🤖 Multi-Agent AI Trading System");
    setAppMode("trading");

    // Fit view after loading
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }
    }, 100);

    // Celebration effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    console.log("✅ Agentic Demo loaded! 7 AI agents ready to collaborate.");
  }, [setNodes, setEdges, setWorkflowName, setAppMode, reactFlowInstance]);

  // Auto Layout using Dagre
  const onLayout = useCallback((direction = "LR") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set node dimensions (approximate)
    const nodeWidth = 250;
    const nodeHeight = 100;

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: direction === "LR" ? "left" : "top",
        sourcePosition: direction === "LR" ? "right" : "bottom",
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    setNodes(layoutedNodes);

    // Fit view after layout
    if (reactFlowInstance) {
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2, duration: 800 }), 50);
    }
  }, [nodes, edges, setNodes, reactFlowInstance]);

  const addNode = useCallback(
    (type) => {
      // Get current chain ID from wallet (default to Cronos zkEVM)
      const currentChainId = chain?.id || 240;

      // Get chain-aware config for nodes that need contract addresses
      const config = (type === "registryQuery" || type === "nexusPay")
        ? getNodeConfigForChain(type, currentChainId)
        : NODE_CONFIG[type];

      if (!config) {
        console.error(`[App] No config found for node type: ${type}`);
        return;
      }

      // Create a deep copy of the config to ensure each node has its own independent data
      const deepCopyConfig = JSON.parse(JSON.stringify(config));

      // Calculate center position based on current view
      let position = { x: Math.random() * 400, y: Math.random() * 400 };

      if (reactFlowInstance) {
        // Get center of the viewport
        const zoom = reactFlowInstance.getZoom();
        const { x: viewX, y: viewY } = reactFlowInstance.getViewport();

        // Center of the wrapper roughly (assuming full screen usage, approx 800x600 visible area)
        // Convert screen center to flow coordinates: (screenX - viewX) / zoom
        // Using window size is safer for full screen apps
        const centerX = (window.innerWidth / 2 - 250 - viewX) / zoom; // Adjust 250 for sidebar
        const centerY = (window.innerHeight / 2 - viewY) / zoom;

        // Add some randomness so nodes don't stack perfectly on top of each other
        position = {
          x: centerX + (Math.random() - 0.5) * 50,
          y: centerY + (Math.random() - 0.5) * 50
        };
      }

      const newNode = {
        id: getId(),
        type: "custom",
        position: position,
        data: {
          type: type,
          ...deepCopyConfig,
          // Ensure node_data is a fresh object for each node instance
          node_data: { ...deepCopyConfig.node_data },
        },
      };

      console.log(`[App] Created ${type} node for chain ${currentChainId}:`, newNode.data.node_data);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, reactFlowInstance, chain]
  );

  const handleSuggestionConnect = useCallback((sourceId, targetType) => {
    // Get current chain ID from wallet
    const currentChainId = chain?.id || 240;

    // Get chain-aware config for nodes that need contract addresses
    const config = (targetType === "registryQuery" || targetType === "nexusPay")
      ? getNodeConfigForChain(targetType, currentChainId)
      : NODE_CONFIG[targetType];

    if (!config) {
      console.error(`[App] No config found for node type: ${targetType}`);
      return;
    }

    const deepCopyConfig = JSON.parse(JSON.stringify(config));

    // Find source node to position relative to it
    const sourceNode = nodes.find(n => n.id === sourceId);
    let position = { x: 300, y: 300 };
    if (sourceNode) {
      position = { x: sourceNode.position.x + 300, y: sourceNode.position.y };
    }

    const newNodeId = getId();
    const newNode = {
      id: newNodeId,
      type: "custom",
      position: position,
      data: {
        type: targetType,
        ...deepCopyConfig,
        node_data: { ...deepCopyConfig.node_data },
      },
    };

    console.log(`[App] Connected ${targetType} node for chain ${currentChainId}`);
    setNodes((nds) => nds.concat(newNode));

    // 2. Connect source to new node with robust handle detection
    const sourceHandles = Object.keys(sourceNode?.data?.outputs || {});
    const targetHandles = Object.keys(deepCopyConfig.inputs || {});

    // Ensure we have valid handles to connect
    const sourceHandle = sourceHandles.length > 0 ? sourceHandles[0] : null;
    const targetHandle = targetHandles.length > 0 ? targetHandles[0] : null;

    // Fallback: If no explicit outputs/inputs defined but node types imply connection, try null handles (default)
    // But CustomNode usually requires IDs.

    if (sourceHandle !== null && targetHandle !== null) {
      const newEdge = {
        id: `e-${sourceId}-${newNodeId}`,
        source: sourceId,
        target: newNodeId,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: 'default',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      confetti({ particleCount: 30, spread: 50, origin: { x: 0.9, y: 0.9 } });
    } else {
      console.warn("Guidance: Could not find valid handles to connect", { sourceHandle, targetHandle, sourceId, targetType });
      // Create the node anyway so user can manually connect
    }



  }, [nodes, setNodes, setEdges, chain]);

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...newData } } : node
        )
      );
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode((prev) => ({ ...prev, data: { ...newData } }));
      }
    },
    [setNodes, selectedNode]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const deleteEdge = useCallback(
    (edgeId) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const handleExecuteWorkflow = useCallback(() => {
    if (!isConnected) {
      alert("Please connect your wallet to execute the workflow.");
      return;
    }
    // Show cost estimator first
    setIsCostEstimatorOpen(true);
  }, [
    isConnected,
  ]);

  // Actually execute workflow after cost estimation
  const executeWorkflowAfterEstimate = useCallback(() => {
    setIsCostEstimatorOpen(false);
    startExecution();
    clearLogs();
    executeWorkflow(nodes, edges, workflowName, address, workflowType);
  }, [
    executeWorkflow,
    nodes,
    edges,
    workflowName,
    address,
    workflowType,
    startExecution,
    clearLogs
  ]);

  const handleSave = async () => {
    if (!isConnected) {
      alert("Please connect your wallet to save the workflow.");
      return;
    }
    const workflowData = {
      type: workflowType,
      name: workflowName,
      nodes: {},
      edges: {},
    };
    nodes.forEach((node) => {
      workflowData.nodes[node.id] = {
        position: node.position,
        label: node.data.label,
        type: node.data.type,
        node_data: node.data.node_data,
        inputs: node.data.inputs,
        outputs: node.data.outputs,
      };
    });
    edges.forEach((edge) => {
      if (!workflowData.edges[edge.source])
        workflowData.edges[edge.source] = {};
      if (!workflowData.edges[edge.source][edge.target])
        workflowData.edges[edge.source][edge.target] = {};
      workflowData.edges[edge.source][edge.target][edge.sourceHandle] =
        edge.targetHandle;
    });
    const finalSaveObject = {
      user_wallet: address,
      workflow_name: workflowName,
      workflow_data: workflowData,
    };
    console.log("Saving Workflow:", JSON.stringify(finalSaveObject, null, 2));
    try {
      const response = await fetch("https://d8n-dz9h.vercel.app/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalSaveObject),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Something went wrong");
      alert(`Success: ${result.message}`);
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Export workflow as JSON file
  const exportWorkflowJSON = useCallback(() => {
    const workflowData = {
      type: workflowType,
      name: workflowName,
      createdAt: new Date().toISOString(),
      nodes: {},
      edges: {},
    };

    nodes.forEach((node) => {
      workflowData.nodes[node.id] = {
        position: node.position,
        label: node.data.label,
        type: node.data.type,
        node_data: node.data.node_data,
        inputs: node.data.inputs,
        outputs: node.data.outputs,
      };
    });

    edges.forEach((edge) => {
      if (!workflowData.edges[edge.source])
        workflowData.edges[edge.source] = {};
      if (!workflowData.edges[edge.source][edge.target])
        workflowData.edges[edge.source][edge.target] = {};
      workflowData.edges[edge.source][edge.target][edge.sourceHandle] =
        edge.targetHandle;
    });

    const jsonString = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("📥 Workflow exported:", workflowName);
  }, [nodes, edges, workflowName, workflowType]);

  // Import workflow from JSON file
  const importWorkflowJSON = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const workflowData = JSON.parse(content);

        // Validate basic structure
        if (!workflowData.nodes || !workflowData.edges) {
          throw new Error("Invalid workflow file format");
        }

        // Convert nodes object back to array if needed (exported format uses object)
        const nodesToLoad = Array.isArray(workflowData.nodes)
          ? workflowData.nodes
          : Object.entries(workflowData.nodes).map(([id, node]) => ({
            id,
            ...node
          }));

        // Normalize nodes structure if they came from export
        const normalizedNodes = nodesToLoad.map(node => ({
          id: node.id || `imported-${Date.now()}-${Math.random()}`,
          position: (node.position && typeof node.position.x === 'number')
            ? node.position
            : { x: Math.random() * 400, y: Math.random() * 400 }, // Fallback for missing position
          type: node.type || "custom",
          data: {
            label: node.label || node.data?.label || "Node",
            type: node.type || node.data?.type || "unknown", // Handle both export format and raw node format
            node_data: node.node_data || node.data?.node_data || {},
            inputs: node.inputs || node.data?.inputs || {},
            outputs: node.outputs || node.data?.outputs || {},
          }
        }));

        // Handle edges
        let edgesToLoad = [];
        if (Array.isArray(workflowData.edges)) {
          edgesToLoad = workflowData.edges;
        } else {
          // Convert from export format (nested objects)
          Object.entries(workflowData.edges).forEach(([source, targets]) => {
            Object.entries(targets).forEach(([target, handles]) => {
              Object.entries(handles).forEach(([sourceHandle, targetHandle]) => {
                edgesToLoad.push({
                  id: `e-${source}-${sourceHandle}-${target}-${targetHandle}`,
                  source,
                  target,
                  sourceHandle,
                  targetHandle
                });
              });
            });
          });
        }

        setWorkflowName(workflowData.name || "Imported Workflow");
        if (workflowData.type) setWorkflowType(workflowData.type);
        setNodes(normalizedNodes);
        setEdges(edgesToLoad);

        // Reset file input
        event.target.value = '';

        // Fit view
        setTimeout(() => {
          if (reactFlowInstance) {
            reactFlowInstance.fitView();
          }
        }, 100);

        alert("✅ Workflow imported successfully!");
      } catch (error) {
        console.error("Error importing workflow:", error);
        alert(`❌ Failed to import workflow: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges, setWorkflowName, setWorkflowType, reactFlowInstance]);

  const loadWorkflow = useCallback(
    (flow) => {
      const { workflowName: name, workflowData } = flow;

      const nodesToLoad = Object.entries(workflowData.nodes).map(
        ([id, nodeData]) => ({
          id,
          position: nodeData.position,
          type: "custom",
          data: {
            label: nodeData.label,
            type: nodeData.type,
            node_data: nodeData.node_data,
            inputs: nodeData.inputs,
            outputs: nodeData.outputs,
          },
        })
      );

      const edgesToLoad = [];
      Object.entries(workflowData.edges).forEach(([source, targets]) => {
        Object.entries(targets).forEach(([target, handles]) => {
          Object.entries(handles).forEach(([sourceHandle, targetHandle]) => {
            edgesToLoad.push({
              id: `reactflow__edge-${source}${sourceHandle}-${target}${targetHandle}`,
              source,
              target,
              sourceHandle,
              targetHandle,
            });
          });
        });
      });

      setWorkflowName(name);
      setWorkflowType(workflowData.type || "once"); // Set workflow type from loaded data, default to "once"
      setNodes(nodesToLoad);
      setEdges(edgesToLoad);

      // Fit view to show the loaded workflow
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [setNodes, setEdges, setWorkflowType, reactFlowInstance]
  );

  // 🚀 ONE CLICK DEMO SHOWCASE - Load impressive repeat workflow
  const loadDemoShowcase = useCallback(async () => {
    try {
      const response = await fetch('/workflows/demo-showcase.json');
      const workflowData = await response.json();

      // Load the workflow using existing loadWorkflow function
      loadWorkflow({
        workflowName: workflowData.name,
        workflowData: workflowData
      });

      // Set to repeat mode for continuous execution
      setWorkflowType('repeat');
      setAppMode('trading');

      // Celebration effect
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#ec4899', '#ef4444']
      });

      console.log("🚀 Demo Showcase loaded! Live trading workflow ready!");
    } catch (error) {
      console.error("Failed to load demo showcase:", error);
    }
  }, [loadWorkflow, setWorkflowType, setAppMode]);

  const loadTemplate = useCallback(
    (template) => {
      // Convert template format to the format expected by the canvas
      const nodesToLoad = template.nodes.map((templateNode) => {
        const config = NODE_CONFIG[templateNode.type];
        return {
          id: templateNode.id,
          position: templateNode.position,
          type: "custom",
          data: {
            type: templateNode.type,
            label: templateNode.data.label,
            node_data: templateNode.data.node_data,
            inputs: config?.inputs || {},
            outputs: config?.outputs || {},
          },
        };
      });

      const edgesToLoad = template.edges.map((templateEdge) => ({
        id: templateEdge.id,
        source: templateEdge.source,
        target: templateEdge.target,
        sourceHandle: templateEdge.sourceHandle,
        targetHandle: templateEdge.targetHandle,
        label: templateEdge.label,
      }));

      setWorkflowName(template.name);
      setNodes(nodesToLoad);
      setEdges(edgesToLoad);

      // Fit view to show the loaded template
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [setNodes, setEdges, reactFlowInstance]
  );

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen font-sans bg-slate-50/30">
        {/* Modern Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="flex justify-between items-center px-4 py-2.5">
            {/* Left: Branding + Workflow Name */}
            <div className="flex items-center gap-4">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                    <span className="text-white font-black text-lg tracking-tighter">N</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Nexus</h1>
                  <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Autonomous DeFi</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-9 w-px bg-slate-200" />

              {/* Workflow Info */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-lg px-3 py-1.5 w-[220px] transition-all outline-none"
                  placeholder="Workflow Name"
                />

                {/* Node Count */}
                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">{nodes.length} nodes</span>

                {/* 🚀 ONE-CLICK DEMO BUTTON - Prominent for Hackathon Judges */}
                <button
                  onClick={loadDemoShowcase}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-sm rounded-xl hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all animate-pulse hover:animate-none border-2 border-amber-300"
                  title="Load a pre-built multi-agent AI trading workflow"
                >
                  <span className="text-lg">🚀</span>
                  One-Click Demo
                </button>

                {/* Current Mode Badge - Hidden (always AI Trading now) */}
                {/* <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${appMode === "trading"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-violet-100 text-violet-700"
                  }`}>
                  {appMode === "trading" ? "AI Trading" : "Web3 Workflow"}
                </span> */}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* AI Decision Panel Toggle */}
              {appMode === "trading" && (
                <button
                  onClick={() => setIsAIDecisionPanelOpen(!isAIDecisionPanelOpen)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all ${isAIDecisionPanelOpen
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                    }`}
                >
                  <span className="text-lg">🧠</span>
                  AI Reasoning
                </button>
              )}

              {/* Live Trading Dashboard */}
              <button
                onClick={() => setIsLiveTradingOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all"
              >
                <TrendingUp size={16} />
                Live Trading
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 mx-1" />

              {/* Features Dropdown */}
              <FeaturesDropdown
                onOpenSessionKeys={() => setIsSessionKeysOpen(true)}
                onOpenAIPanel={() => setIsAIPanelOpen(true)}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                onOpenLiveTrading={() => setIsLiveTradingOpen(true)}
                onOpenTransactions={() => setIsTransactionDashboardOpen(true)}
                onOpenProviders={() => setIsProviderLeaderboardOpen(true)}
              />

              {/* Tools Dropdown - Utilities */}
              <ToolsDropdown
                onOpenCharts={() => setIsChartsOpen(true)}
                onOpenNews={() => setIsNewsOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
                onOpenDocs={() => setIsDocsOpen(true)}
                onClearCanvas={() => { setNodes([]); setEdges([]); }}
                onLayout={() => onLayout("LR")}
                onLoadDemo={loadDemoWorkflow}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenCostEstimator={() => setIsCostEstimatorOpen(true)}
                onOpenImport={() => setIsImportModalOpen(true)}
              />

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 mx-1" />

              {/* One Click Demo Button - Showcase */}
              <button
                onClick={loadDemoShowcase}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white font-bold text-sm rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all animate-pulse"
              >
                <Play size={18} />
                🚀 One Click Demo
              </button>

              {/* Deposit Button - Primary Action */}
              <button
                onClick={() => setIsDepositOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm rounded-xl hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all"
              >
                <Wallet size={16} />
                Deposit
              </button>

              {/* Portfolio Button - View Active Workflows */}
              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg transition-all"
              >
                <TrendingUp size={16} />
                Portfolio
              </button>

              {/* Workflow Actions */}
              <ViewWorkflows onLoadWorkflow={loadWorkflow} />
              <HypergraphSaver
                workflowName={workflowName}
                nodes={nodes}
                edges={edges}
              />

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
              >
                <Save size={16} />
                Save
              </button>

              {/* Wallet */}
              <WalletConnector />

              {/* Modals (rendered here but not visible in navbar) */}
              <ImportWorkflowModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(data) => loadWorkflow({ workflowName: data.name, workflowData: data })}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area - Scaled for better visibility on standard screens */}
        <div className="flex flex-grow overflow-hidden origin-top-left transition-transform duration-300">
          <Sidebar
            onAddNode={addNode}
            onExecuteWorkflow={handleExecuteWorkflow}
            onLoadTemplate={loadTemplate}
            nodes={nodes}
            edges={edges}
            onConnectSuggestion={handleSuggestionConnect}
            workflowType={workflowType}
            setWorkflowType={setWorkflowType}
            appMode={appMode}
            setAppMode={setAppMode}
            onGenerateWorkflow={(workflow) => {
              if (workflow?.nodes) {
                const newNodes = workflow.nodes.map((n, i) => ({
                  id: `ai-${Date.now()}-${i}`,
                  type: "custom",
                  position: { x: 100 + i * 300, y: 150 },
                  data: n.data,
                }));
                setNodes((nds) => [...nds, ...newNodes]);
                if (workflow.edges) {
                  setEdges((eds) => [...eds, ...workflow.edges]);
                }
              }
            }}
          />

          <main className="flex-grow relative">
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDeleteNode={deleteNode}
              onDeleteEdge={deleteEdge}
              onInit={setReactFlowInstance}
              currentExecutingNode={currentExecutingNode}
            />
          </main>
          {selectedNode && (
            <SettingsPanel
              node={selectedNode}
              onUpdateNode={updateNodeData}
              onDeselect={() => setSelectedNode(null)}
            />
          )}
        </div>

        {/* Execution Logs */}
        <ExecutionLogsPanel
          logs={logs}
          isExecuting={isExecuting}
          onClear={clearLogs}
        />

        {/* Global Settings Modal */}
        <GlobalSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Charts Panel */}
        <ChartsPanel
          isOpen={isChartsOpen}
          onClose={() => setIsChartsOpen(false)}
          onAddNodes={(newNodes) => {
            setNodes((nds) => [...nds, ...newNodes]);
            const newEdges = newNodes.slice(0, -1).map((node, i) => ({
              id: `ai-edge-${Date.now()}-${i}`,
              source: node.id,
              target: newNodes[i + 1].id,
              type: "default",
            }));
            setEdges((eds) => [...eds, ...newEdges]);
          }}
        />

        {/* News Panel */}
        <NewsPanel
          isOpen={isNewsOpen}
          onClose={() => setIsNewsOpen(false)}
        />

        {/* Export Panel */}
        <ExportPanel
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          nodes={nodes}
          edges={edges}
          workflowName={workflowName}
        />

        {/* API Marketplace Panel */}
        <MarketplacePanel
          isOpen={isMarketplaceOpen}
          onClose={() => setIsMarketplaceOpen(false)}
          onAddAPI={(api) => {
            const newNode = {
              id: `api-${Date.now()}`,
              type: "custom",
              position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
              data: {
                label: api.name,
                type: api.category === "oracle" ? "pyth-network" : api.category === "ai" ? "nexusPay" : "registryQuery",
                inputs: {},
                outputs: { data: { type: "json" } },
                node_data: { api_id: api.id, price: api.pricePerCall },
              },
            };
            setNodes((nds) => [...nds, newNode]);
          }}
        />

        {/* Docs Panel */}
        <DocsPanel
          isOpen={isDocsOpen}
          onClose={() => setIsDocsOpen(false)}
        />

        {/* Session Key Panel (Feature 2: Account Abstraction) */}
        <SessionKeyPanel
          isOpen={isSessionKeysOpen}
          onClose={() => setIsSessionKeysOpen(false)}
        />

        {/* AI Agent Panel (Feature 1: Text-to-DeFi) */}
        <AIAgentPanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
          onAddNodes={(newNodes, newEdges) => {
            setNodes((nds) => [...nds, ...newNodes]);
            // Use provided edges if available, otherwise auto-connect sequentially
            if (newEdges && newEdges.length > 0) {
              setEdges((eds) => [...eds, ...newEdges]);
            } else if (newNodes.length > 1) {
              const autoEdges = newNodes.slice(0, -1).map((node, i) => ({
                id: `ai-edge-${Date.now()}-${i}`,
                source: node.id,
                target: newNodes[i + 1].id,
                type: "default",
              }));
              setEdges((eds) => [...eds, ...autoEdges]);
            }
          }}
        />

        {/* Leaderboard Panel (Top Performers) */}
        <LeaderboardPanel
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          onCopyWorkflow={(wf) => {
            console.log("Copying workflow:", wf.name);
            // Load workflow template logic here
          }}
        />

        {/* Deposit Panel - NEW */}
        <DepositPanel
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
        />

        {/* Transaction Dashboard - PHASE 6: PROMPT 14 */}
        <TransactionDashboard
          isOpen={isTransactionDashboardOpen}
          onClose={() => setIsTransactionDashboardOpen(false)}
        />

        {/* Live Trading Dashboard */}
        <LiveTradingDashboard
          isOpen={isLiveTradingOpen}
          onClose={() => setIsLiveTradingOpen(false)}
        />

        {/* AI Trading Panel - Left Sliding Panel */}
        <AITradingPanel
          isOpen={isAITradingPanelOpen}
          onClose={() => setIsAITradingPanelOpen(false)}
          onAddNode={addNode}
          onLoadTemplate={loadTemplate}
        />

        {/* AI Decision Panel - Shows AI reasoning during execution */}
        {isAIDecisionPanelOpen && (
          <div className="fixed top-20 right-4 z-40 w-96">
            <AIDecisionPanel
              executionLogs={logs}
              isExecuting={isExecuting}
            />
            <button
              onClick={() => setIsAIDecisionPanelOpen(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Cost Estimator Modal */}
        <CostEstimatorModal
          isOpen={isCostEstimatorOpen}
          onClose={() => setIsCostEstimatorOpen(false)}
          workflow={{
            nodes: nodes.reduce((acc, node) => {
              acc[node.id] = {
                id: node.id,
                type: node.data.type,
                label: node.data.label,
                node_data: node.data.node_data
              };
              return acc;
            }, {})
          }}
          onProceed={() => {
            setIsCostEstimatorOpen(false);
            startExecution();
            clearLogs();
            executeWorkflow(nodes, edges, workflowName, address, workflowType);
          }}
        />

        {/* Provider Leaderboard */}
        <ProviderLeaderboard
          isOpen={isProviderLeaderboardOpen}
          onClose={() => setIsProviderLeaderboardOpen(false)}
        />

        {/* Agent Chat Log - Shows agent collaboration during execution */}
        {isExecuting && (
          <div className="fixed bottom-24 right-4 z-40 w-96">
            <LiveTradingChart
              isExecuting={isExecuting}
              executedNodes={executedNodes.size}
              totalNodes={nodes.length}
            />
            <AgentChatLog
              nodes={nodes}
              isExecuting={isExecuting}
              currentNodeId={currentExecutingNode}
            />
          </div>
        )}

        {/* Trading Execution Page - Full Screen Overlay */}
        {isResultModalOpen && (
          <TradingExecutionPage
            onClose={() => setIsResultModalOpen(false)}
            workflowResult={logs}
          />
        )}

        {/* Workflow Portfolio - View & Stop Active Workflows */}
        {isPortfolioOpen && (
          <WorkflowPortfolio
            onClose={() => setIsPortfolioOpen(false)}
            onViewExecution={(workflow) => {
              setWorkflowResultData(workflow.logs || []);
              setIsResultModalOpen(true);
            }}
          />
        )}

      </div >
    </ReactFlowProvider >
  );
}

