// Node configuration for workflow components

import { CONTRACTS } from "./contracts";

// Default chain ID (Cronos zkEVM Testnet)
const DEFAULT_CHAIN_ID = 240;

export const NODE_CONFIG = {
  "pyth-network": {
    label: "Pyth Price Feed",
    inputs: { activate: { type: "bool" } },
    outputs: { price: { type: "float" } },
    node_data: { symbol: "BTC_USD" },
  },
  limitOrder: {
    label: "1inch Limit Order",
    inputs: { activate: { type: "bool" } },
    outputs: {},
    node_data: {
      makerToken: "",
      takerToken: "",
      makingAmount: "",
      takingAmount: "",
    },
  },
  queryBalance: {
    label: "Query balance",
    inputs: { activate: { type: "bool" } },
    outputs: {
      balance: 0,
    },
    node_data: {
      tokenAddress: "",
      walletAddress: "",
    },
  },
  sendToken: {
    label: "Send Token to any address",
    inputs: { activate: { type: "bool" } },
    outputs: { txHash: { type: "string" } },
    node_data: {
      tokenAddress: "",
      destination: "",
      amount: "",
    },
  },
  condition: {
    label: "Condition",
    inputs: { price: { type: "float" } },
    outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
    node_data: { condition: "price > 100000" },
  },
  swap: {
    label: "1inch Swap",
    inputs: { activate: { type: "bool" } },
    outputs: {},
    node_data: {
      tokenIn: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      tokenOut: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
      amountIn: "10000000",
      amountOutMin: "0",
    },
  },
  print: {
    label: "Print Debug",
    inputs: { test: { type: "float" } },
    outputs: {},
    node_data: { sample: "sample" },
  },
  // ========== NEXUS NODES ==========
  nexusPay: {
    label: "Nexus Pay (402 API)",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      data: { type: "object" }, 
      txHash: { type: "string" }, 
      cost: { type: "string" } 
    },
    node_data: {
      url: "http://localhost:4000/api/news/crypto",
      method: "GET", // HTTP method
      headers: "", // JSON string for custom headers
      body: "", // JSON string for POST/PUT body
      chainId: DEFAULT_CHAIN_ID, // Cronos zkEVM Testnet
      nexusBackendUrl: "http://localhost:3001",
    },
  },
  registryQuery: {
    label: "Service Registry",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      services: { type: "array" },
      count: { type: "number" }
    },
    node_data: {
      category: "news",
      maxPrice: "1000000000000000000",
      chainId: DEFAULT_CHAIN_ID, // Cronos zkEVM Testnet
      // Using deployed NexusRegistry contract address on Cronos zkEVM Testnet
      registryAddress: CONTRACTS[DEFAULT_CHAIN_ID]?.registry || "0xe821fAbc3d23790596669043b583e931d8fC2710",
    },
  },
  // ========== CROSS-CHAIN NODES (Feature 3) ==========
  crossChainTrigger: {
    label: "Cross-Chain Trigger",
    inputs: { activate: { type: "bool" } },
    outputs: { messageId: { type: "string" }, status: { type: "string" } },
    node_data: {
      sourceChain: 11155111,
      destinationChain: 84532,
      receiver: "",
      protocol: "ccip", // ccip or layerzero
    },
  },
  crossChainSwap: {
    label: "Cross-Chain Swap",
    inputs: { activate: { type: "bool" } },
    outputs: { txHash: { type: "string" } },
    node_data: {
      sourceChain: 11155111,
      destinationChain: 80002,
      tokenIn: "",
      tokenOut: "",
      amountIn: "",
    },
  },
  // ========== RISK MANAGEMENT NODES (Feature 5) ==========
  healthFactor: {
    label: "Aave Health Factor",
    inputs: { activate: { type: "bool" } },
    outputs: { healthFactor: { type: "float" }, isHealthy: { type: "bool" } },
    node_data: {
      protocol: "aave", // aave, compound
      walletAddress: "",
      threshold: "1.1",
    },
  },
  autoRepay: {
    label: "Auto Repay Loan",
    inputs: { healthFactor: { type: "float" } },
    outputs: { txHash: { type: "string" }, repaidAmount: { type: "string" } },
    node_data: {
      protocol: "aave",
      repayPercentage: "50", // % of debt to repay
      collateralToken: "",
    },
  },
  liquidationAlert: {
    label: "Liquidation Alert",
    inputs: { healthFactor: { type: "float" } },
    outputs: { alert: { type: "bool" } },
    node_data: {
      warningThreshold: "1.5",
      criticalThreshold: "1.1",
      notifyEmail: "",
    },
  },
  // ========== AI TRADING NODES ==========
  aiPrediction: {
    label: "AI Market Prediction",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      prediction: { type: "object" },
      currentPrice: { type: "float" },
      sentiment: { type: "string" },
      confidence: { type: "float" }
    },
    node_data: {
      symbol: "BTC",
      apiUrl: "http://localhost:4000/api/predictions/btc",
      provider: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      paymentAmount: "1000000000000000", // 0.001 CRO
      chainId: DEFAULT_CHAIN_ID,
      nexusBackendUrl: "http://localhost:3001",
    },
  },
  tradingAgent: {
    label: "AI Trading Agent",
    inputs: { 
      prediction: { type: "object" },
      price: { type: "float" }
    },
    outputs: { 
      signal: { type: "object" },
      action: { type: "string" },
      shouldTrade: { type: "bool" },
      entryPrice: { type: "float" },
      stopLoss: { type: "float" },
      takeProfit: { type: "float" },
      positionSize: { type: "string" }
    },
    node_data: {
      symbol: "BTC",
      strategy: "ai-signal", // ai-signal, momentum, mean-reversion, dca
      riskLevel: "moderate", // conservative, moderate, aggressive
      maxPositionSize: "0.5", // Max position in native token
      stopLossPercent: 5,
      takeProfitPercent: 10,
      maxDailyLoss: "0.1",
    },
  },
  stopLoss: {
    label: "Stop-Loss Monitor",
    inputs: { 
      price: { type: "float" },
      currentPrice: { type: "float" }
    },
    outputs: { 
      action: { type: "string" },
      reason: { type: "string" },
      shouldClose: { type: "bool" },
      pnlPercent: { type: "float" }
    },
    node_data: {
      symbol: "BTC",
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      positionType: "long", // long or short
      positionSize: "0",
      trailingStop: true,
      trailingPercent: 2,
    },
  },
  riskManager: {
    label: "Risk Manager",
    inputs: { 
      signal: { type: "object" },
      trade: { type: "object" }
    },
    outputs: { 
      approved: { type: "bool" },
      adjustedSize: { type: "string" },
      reason: { type: "string" },
      checks: { type: "array" }
    },
    node_data: {
      maxPortfolioRisk: 30, // Max % of portfolio at risk
      maxSinglePositionSize: 10, // Max % per single position
      maxDailyLoss: 5, // Max daily loss in %
      maxOpenPositions: 3, // Max concurrent positions
      minBalanceReserve: 20, // Min % to keep as reserve
      correlationLimit: 0.7, // Max correlation between positions
      // Portfolio state (updated dynamically)
      totalBalance: "1.0",
      availableBalance: "1.0",
      openPositions: 0,
      dailyPnL: 0,
      totalExposure: 0,
    },
  },
  visionAnalysis: {
    label: "AI Vision Analysis",
    inputs: { 
      imageUrl: { type: "string" },
      imageBase64: { type: "string" },
      price: { type: "float" }
    },
    outputs: { 
      analysis: { type: "string" },
      sentiment: { type: "string" },
      confidence: { type: "float" },
      patterns: { type: "array" },
      suggestedAction: { type: "string" },
      entryZone: { type: "object" },
      stopLoss: { type: "float" },
      takeProfit: { type: "array" },
      riskLevel: { type: "string" },
      tradingConfig: { type: "object" }
    },
    node_data: {
      prompt: "Analyze this chart and provide trading recommendations based on technical analysis",
      persona: "default", // aggressive, conservative, scalper, swing, contrarian, default
      imageUrl: "", // URL to chart image
      imageBase64: "", // Base64 encoded image (for uploaded images)
      analysisType: "chart", // chart, sentiment, pattern, custom
      outputFormat: "both", // signal, analysis, both
      apiProvider: "mock", // gemini, openai, mock
      apiKey: "", // API key (or use env var)
    },
  },
  newsPrediction: {
    label: "News + Pattern Prediction",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      prediction: { type: "object" },
      signal: { type: "string" },
      sentiment: { type: "string" },
      sentimentScore: { type: "float" },
      predictedMove: { type: "float" },
      confidence: { type: "float" },
      shouldTrade: { type: "bool" },
      action: { type: "string" },
      reasoning: { type: "array" },
      news: { type: "array" },
      patterns: { type: "array" }
    },
    node_data: {
      symbol: "BTC",
      newsSource: "aggregated", // aggregated, cryptocompare, coindesk, cointelegraph
      lookbackHours: 24,
      minConfidence: 50, // Min confidence % to generate trade signal
      includePatternAnalysis: true, // Match news with historical patterns
    },
  },
  // ========== DEFI YIELD NODES ==========
  apyMonitor: {
    label: "APY Monitor",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      apyData: { type: "array" },
      bestProtocol: { type: "string" },
      bestAPY: { type: "float" },
      worstAPY: { type: "float" },
      apySpread: { type: "float" },
      shouldRebalance: { type: "bool" }
    },
    node_data: {
      protocols: ["aave-v3", "compound-v3", "curve-3pool", "yearn-usdc", "morpho-aave"],
      asset: "USDC",
      minAPY: 0,
      useRealAPI: true, // Use DeFiLlama API
      chain: "Ethereum",
    },
  },
  yieldOptimizer: {
    label: "Yield Optimizer Agent",
    inputs: { 
      apyData: { type: "array" },
      bestAPY: { type: "float" }
    },
    outputs: { 
      action: { type: "string" },
      shouldRebalance: { type: "bool" },
      fromProtocol: { type: "string" },
      toProtocol: { type: "string" },
      expectedGainPercent: { type: "float" },
      netProfit: { type: "string" },
      confidence: { type: "float" },
      reasoning: { type: "array" }
    },
    node_data: {
      currentProtocol: "aave-v3",
      depositAmount: "1000", // USD value
      minProfitThreshold: 0.5, // Min % gain to trigger
      gasPrice: "30", // Gwei
      projectionMonths: 12,
    },
  },
  // ========== ARBITRAGE NODES ==========
  arbitrage: {
    label: "DEX Arbitrage Scanner",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      success: { type: "bool" },
      opportunity: { type: "object" },
      shouldExecute: { type: "bool" },
      action: { type: "string" },
      buyDex: { type: "string" },
      sellDex: { type: "string" },
      expectedProfit: { type: "float" },
      confidence: { type: "float" },
      executionParams: { type: "object" }
    },
    node_data: {
      tokenIn: "USDC",
      tokenOut: "WETH",
      amount: "1000000000", // 1000 USDC (6 decimals)
      dexes: ["uniswap", "sushiswap", "1inch"],
      minProfitPercent: 0.5, // Min profit % to execute
      maxSlippage: 1, // Max slippage %
      includeGasCost: true,
      chainId: 1, // Ethereum mainnet
      useMEVProtection: false,
    },
  },
  crossChainArbitrage: {
    label: "Cross-Chain Arbitrage",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      success: { type: "bool" },
      opportunity: { type: "object" },
      shouldExecute: { type: "bool" },
      action: { type: "string" },
      reasoning: { type: "array" },
      executionSteps: { type: "array" }
    },
    node_data: {
      token: "ETH",
      amount: "1", // Amount in token units
      chains: ["ethereum", "arbitrum", "optimism", "base"],
      minProfitPercent: 0.5, // Min profit % after all costs
      maxBridgeTime: 30, // Max bridge time in minutes
      includeBridgeCost: true,
    },
  },
  // ========== TRUST & SAFETY NODES (COMPULSORY FOR AI TRADING) ==========
  maxInvestment: {
    label: "Max Investment Limit",
    inputs: { activate: { type: "bool" } },
    outputs: { 
      approved: { type: "bool" },
      adjustedAmount: { type: "string" },
      reason: { type: "string" }
    },
    node_data: {
      maxAmountPerTrade: "0.1", // Max amount per single trade (REQUIRED)
      maxTotalExposure: "0.5", // Max total portfolio exposure (REQUIRED)
      currency: "CRO",
      enforceLimit: true, // Cannot be disabled
    },
    required: true,
    requiredInputs: ["maxAmountPerTrade", "maxTotalExposure"],
  },
  dailyLossLimit: {
    label: "Daily Loss Limit",
    inputs: { 
      currentPnL: { type: "float" },
      trade: { type: "object" }
    },
    outputs: { 
      canTrade: { type: "bool" },
      remainingBudget: { type: "string" },
      dailyLoss: { type: "float" },
      alert: { type: "string" }
    },
    node_data: {
      maxDailyLossPercent: 5, // Max daily loss in % (REQUIRED)
      maxDailyLossAmount: "0.05", // Max daily loss in absolute (REQUIRED)
      pauseOnLimit: true, // Pause trading when limit hit
      resetTime: "00:00", // UTC time to reset daily counter
      notifyOnWarning: true, // Notify at 80% of limit
    },
    required: true,
    requiredInputs: ["maxDailyLossPercent", "maxDailyLossAmount"],
  },
  userConfirmation: {
    label: "User Confirmation",
    inputs: { 
      trade: { type: "object" },
      signal: { type: "object" }
    },
    outputs: { 
      confirmed: { type: "bool" },
      userResponse: { type: "string" },
      timestamp: { type: "number" }
    },
    node_data: {
      requireConfirmation: true, // Always require user confirmation (REQUIRED)
      confirmationMethod: "popup", // popup, notification, both
      timeoutSeconds: 60, // Auto-reject after timeout
      showDetails: true, // Show trade details in confirmation
      allowAutoApprove: false, // Never auto-approve (safety)
      minConfirmationDelay: 3, // Min seconds before user can confirm (prevent accidents)
    },
    required: true,
    requiredInputs: ["requireConfirmation"],
  },
};

/**
 * Get node configuration with chain-specific contract addresses
 * @param {string} nodeType - Type of node (e.g., "registryQuery", "nexusPay")
 * @param {number} chainId - Chain ID to use for contract addresses (defaults to 240)
 * @returns {Object} Node configuration with chain-specific addresses
 */
export function getNodeConfigForChain(nodeType, chainId = DEFAULT_CHAIN_ID) {
  const baseConfig = NODE_CONFIG[nodeType];
  if (!baseConfig) {
    console.warn(`[nodeConfig] Unknown node type: ${nodeType}`);
    return null;
  }

  // Clone the config to avoid mutations
  const config = JSON.parse(JSON.stringify(baseConfig));

  // Update chain-specific fields based on node type
  if (nodeType === "registryQuery" || nodeType === "nexusPay") {
    const chainContracts = CONTRACTS[chainId];
    
    if (chainContracts) {
      // Update chainId
      config.node_data.chainId = chainId;

      // Update registry address for registryQuery nodes
      if (nodeType === "registryQuery" && chainContracts.registry) {
        config.node_data.registryAddress = chainContracts.registry;
      }
    } else {
      console.warn(`[nodeConfig] No contracts deployed for chain ${chainId}, using defaults`);
    }
  }

  return config;
}

/**
 * Get all available chain IDs that have deployed contracts
 * @returns {number[]} Array of chain IDs
 */
export function getSupportedChainIds() {
  return Object.keys(CONTRACTS).map(Number);
}

/**
 * Check if a chain is supported (has deployed contracts)
 * @param {number} chainId - Chain ID to check
 * @returns {boolean} True if chain is supported
 */
export function isChainSupported(chainId) {
  return chainId in CONTRACTS;
}
