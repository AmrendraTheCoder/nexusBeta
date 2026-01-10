import { tokens } from "./tokenMappings";

/**
 * Template 1: Simple "Buy the Dip" Strategy
 */
export const buyTheDipTemplate = {
  name: "Buy The Dip (WETH)",
  description: "Swaps USDC for WETH when the price drops below $4,500.",
  category: "defi",
  difficulty: "Beginner",
  nodes: [
    {
      id: "pyth-1",
      type: "pyth-network",
      position: { x: 50, y: 150 },
      data: {
        label: "Pyth Price Feed",
        node_data: { symbol: "ETH_USD" },
      },
    },
    {
      id: "condition-1",
      type: "condition",
      position: { x: 350, y: 150 },
      data: {
        label: "Price < $4,500?",
        node_data: { condition: "price < 4500" },
      },
    },
    {
      id: "swap-1",
      type: "swap",
      position: { x: 650, y: 100 },
      data: {
        label: "Swap USDC to WETH",
        node_data: {
          tokenIn: tokens.USDC.address,
          tokenOut: tokens.WETH.address,
          amountIn: "1000000",
          amountOutMin: "0",
        },
      },
    },
    {
      id: "print-1",
      type: "print",
      position: { x: 650, y: 250 },
      data: {
        label: "No Action",
        node_data: { sample: "Price is above threshold. No action taken." },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "pyth-1", target: "condition-1", sourceHandle: "price", targetHandle: "price" },
    { id: "e2-3", source: "condition-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e2-4", source: "condition-1", target: "print-1", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

/**
 * Template 2: Payroll Executor
 */
export const takeProfitTemplate = {
  name: "Payroll Executor",
  description: "Queries balance and sends tokens to multiple recipients based on conditions.",
  category: "defi",
  difficulty: "Intermediate",
  nodes: [
    {
      id: "2",
      type: "queryBalance",
      position: { x: -26, y: 5 },
      data: {
        label: "Query Balance",
        node_data: {
          tokenAddress: "",
          walletAddress: "0x8a453B41c6E454D5b3152f32908Bc9A0DDa689B4",
        },
      },
    },
    {
      id: "3",
      type: "condition",
      position: { x: 262, y: 71 },
      data: {
        label: "Balance Check",
        node_data: { condition: "price > 0.2" },
      },
    },
    {
      id: "4",
      type: "sendToken",
      position: { x: 644, y: -72 },
      data: {
        label: "Send to Recipient 1",
        node_data: {
          tokenAddress: "",
          destination: "0xa9aaC8b17F7fb7dF0104ECd53F8b635b8052b97E",
          amount: "0.001",
        },
      },
    },
    {
      id: "5",
      type: "sendToken",
      position: { x: 640, y: 97 },
      data: {
        label: "Send to Recipient 2",
        node_data: {
          tokenAddress: "",
          destination: "0xaa8A4A0df322aB0a1B5D623450ee1d426aC43C2F",
          amount: "0.001",
        },
      },
    },
    {
      id: "7",
      type: "sendToken",
      position: { x: 644, y: 277 },
      data: {
        label: "Send to Recipient 3",
        node_data: {
          tokenAddress: "",
          destination: "0xaa8A4A0df322aB0a1B5D623450ee1d426aC43C2F",
          amount: "0.001",
        },
      },
    },
  ],
  edges: [
    { id: "e2-3", source: "2", target: "3", sourceHandle: "balance", targetHandle: "price" },
    { id: "e3-4", source: "3", target: "4", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e3-5", source: "3", target: "5", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e3-7", source: "3", target: "7", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

/**
 * Template 3: Simple Limit Order Strategy
 */
export const priceRangeAlertTemplate = {
  name: "Limit Order (INCH)",
  description: "Places a limit order to buy INCH when BTC price is above $50,000.",
  category: "defi",
  difficulty: "Intermediate",
  nodes: [
    {
      id: "pyth-1",
      type: "pyth-network",
      position: { x: 50, y: 150 },
      data: {
        label: "Pyth Price Feed",
        node_data: { symbol: "BTC_USD" },
      },
    },
    {
      id: "condition-1",
      type: "condition",
      position: { x: 350, y: 150 },
      data: {
        label: "Price > $50000?",
        node_data: { condition: "price > 50000" },
      },
    },
    {
      id: "limitOrder-1",
      type: "limitOrder",
      position: { x: 650, y: 100 },
      data: {
        label: "Buy INCH Limit Order",
        node_data: {
          makerToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          takerToken: "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE",
          makingAmount: "1",
          takingAmount: "4",
        },
      },
    },
    {
      id: "print-1",
      type: "print",
      position: { x: 650, y: 250 },
      data: {
        label: "No Order",
        node_data: { sample: "Price below threshold. No limit order placed." },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "pyth-1", target: "condition-1", sourceHandle: "price", targetHandle: "price" },
    { id: "e2-3", source: "condition-1", target: "limitOrder-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e2-4", source: "condition-1", target: "print-1", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

// ============================================
// NEXUS x402 TEMPLATES
// ============================================

/**
 * Template 4: x402 Crypto News Feed
 */
export const x402CryptoNewsTemplate = {
  name: "x402 Crypto News Feed",
  description: "Fetches premium crypto news using automatic 402 payment. Demonstrates the Nexus Pay flow.",
  category: "nexus",
  difficulty: "Beginner",
  featured: true,
  learnMore: "This template shows how x402 (HTTP 402 Payment Required) enables automatic micropayments for API access. When the API returns 402, Nexus Pay handles the blockchain payment and retries to unlock the data.",
  nodes: [
    {
      id: "nexus-pay-1",
      type: "nexusPay",
      position: { x: 100, y: 150 },
      data: {
        label: "Fetch Crypto News",
        node_data: {
          url: "http://localhost:4000/api/news/crypto",
          chainId: 240,
          nexusBackendUrl: "http://localhost:3001",
        },
      },
    },
    {
      id: "print-result",
      type: "print",
      position: { x: 450, y: 150 },
      data: {
        label: "Display News",
        node_data: { sample: "News data will appear here after payment" },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "nexus-pay-1", target: "print-result", sourceHandle: "data", targetHandle: "test" },
  ],
};

/**
 * Template 5: x402 Weather Data Access
 */
export const x402WeatherDataTemplate = {
  name: "x402 Weather Data",
  description: "Access premium weather forecasts with automatic micropayments via Nexus Pay.",
  category: "nexus",
  difficulty: "Beginner",
  featured: true,
  learnMore: "Pay-per-call weather API access. Each request costs a small fee that's automatically handled by the Nexus payment system.",
  nodes: [
    {
      id: "nexus-pay-weather",
      type: "nexusPay",
      position: { x: 100, y: 150 },
      data: {
        label: "Fetch Weather Data",
        node_data: {
          url: "http://localhost:4000/api/weather",
          chainId: 240,
          nexusBackendUrl: "http://localhost:3001",
        },
      },
    },
    {
      id: "condition-temp",
      type: "condition",
      position: { x: 400, y: 150 },
      data: {
        label: "Temp > 25C?",
        node_data: { condition: "price > 25" },
      },
    },
    {
      id: "print-hot",
      type: "print",
      position: { x: 700, y: 80 },
      data: {
        label: "Hot Weather Alert",
        node_data: { sample: "Temperature is above 25C!" },
      },
    },
    {
      id: "print-normal",
      type: "print",
      position: { x: 700, y: 220 },
      data: {
        label: "Normal Weather",
        node_data: { sample: "Temperature is comfortable." },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "nexus-pay-weather", target: "condition-temp", sourceHandle: "data", targetHandle: "price" },
    { id: "e2-3", source: "condition-temp", target: "print-hot", sourceHandle: "true-path", targetHandle: "test", label: "True" },
    { id: "e2-4", source: "condition-temp", target: "print-normal", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

/**
 * Template 6: x402 AI-Powered Trading Analysis
 */
export const x402AITradingTemplate = {
  name: "x402 AI Trading Signals",
  description: "Access AI-powered trading analysis via paid API and automatically execute trades based on signals.",
  category: "nexus",
  difficulty: "Advanced",
  featured: true,
  learnMore: "This combines x402 paid API access with DeFi execution. The AI provides trading signals through a paywall, and the workflow automatically acts on bullish recommendations.",
  nodes: [
    {
      id: "nexus-ai",
      type: "nexusPay",
      position: { x: 50, y: 150 },
      data: {
        label: "Get AI Signal",
        node_data: {
          url: "http://localhost:4000/api/ai/trading-signal",
          chainId: 240,
          nexusBackendUrl: "http://localhost:3001",
        },
      },
    },
    {
      id: "condition-signal",
      type: "condition",
      position: { x: 350, y: 150 },
      data: {
        label: "Bullish Signal?",
        node_data: { condition: "price > 0" },
      },
    },
    {
      id: "swap-buy",
      type: "swap",
      position: { x: 650, y: 80 },
      data: {
        label: "Execute Buy",
        node_data: {
          tokenIn: tokens.USDC.address,
          tokenOut: tokens.WETH.address,
          amountIn: "10000000",
          amountOutMin: "0",
        },
      },
    },
    {
      id: "print-hold",
      type: "print",
      position: { x: 650, y: 250 },
      data: {
        label: "Hold Position",
        node_data: { sample: "AI recommends holding. No action taken." },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "nexus-ai", target: "condition-signal", sourceHandle: "data", targetHandle: "price" },
    { id: "e2-3", source: "condition-signal", target: "swap-buy", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e2-4", source: "condition-signal", target: "print-hold", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

/**
 * Template 7: Service Registry Discovery
 */
export const registryDiscoveryTemplate = {
  name: "Service Registry Query",
  description: "Discover registered API providers in the Nexus ecosystem and compare pricing.",
  category: "nexus",
  difficulty: "Intermediate",
  learnMore: "The Nexus Registry is an on-chain directory of API providers. Query it to find services, compare prices, and verify provider authenticity before making payments.",
  nodes: [
    {
      id: "registry-query",
      type: "registryQuery",
      position: { x: 100, y: 150 },
      data: {
        label: "Query Registry",
        node_data: {
          category: "news",
          maxPrice: "1000000000000000000",
          chainId: 240,
          registryAddress: "",
        },
      },
    },
    {
      id: "print-services",
      type: "print",
      position: { x: 450, y: 150 },
      data: {
        label: "List Services",
        node_data: { sample: "Available services will be listed here" },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "registry-query", target: "print-services", sourceHandle: "services", targetHandle: "test" },
  ],
};

// AI Vision Trading Demo Template
export const aiVisionTradingTemplate = {
  name: "AI Vision Trading Demo",
  description: "Upload a chart → AI Vision Analysis → Trading Agent → Risk Manager → Execute Trade. Perfect for demonstrating autonomous AI trading.",
  category: "ai",
  difficulty: "Intermediate",
  featured: true,
  nodes: [
    {
      id: "vision-1",
      type: "visionAnalysis",
      position: { x: 100, y: 200 },
      data: {
        label: "Vision AI Analysis",
        node_data: {
          prompt: "Analyze this BTC/USD chart. Identify key support/resistance levels, trend direction, and provide a trading recommendation.",
          persona: "default",
          analysisType: "chart",
          outputFormat: "both",
          apiProvider: "gemini"
        },
      },
    },
    {
      id: "trading-1",
      type: "tradingAgent",
      position: { x: 450, y: 150 },
      data: {
        label: "AI Trading Agent",
        node_data: {
          symbol: "BTC",
          strategy: "ai-signal",
          riskLevel: "moderate",
          maxPositionSize: "0.1",
          stopLossPercent: 3,
          takeProfitPercent: 6
        },
      },
    },
    {
      id: "risk-1",
      type: "riskManager",
      position: { x: 450, y: 350 },
      data: {
        label: "Risk Manager",
        node_data: {
          maxPortfolioRisk: 20,
          maxSinglePositionSize: 10,
          maxDailyLoss: 5,
          maxOpenPositions: 3
        },
      },
    },
    {
      id: "confirm-1",
      type: "userConfirmation",
      position: { x: 750, y: 250 },
      data: {
        label: "User Confirmation",
        node_data: {
          requireConfirmation: true,
          timeoutSeconds: 60,
          showDetails: true
        },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "vision-1", target: "trading-1", sourceHandle: "analysis", targetHandle: "prediction" },
    { id: "e1-3", source: "vision-1", target: "risk-1", sourceHandle: "confidence", targetHandle: "signal" },
    { id: "e2-4", source: "trading-1", target: "confirm-1", sourceHandle: "signal", targetHandle: "trade" },
    { id: "e3-4", source: "risk-1", target: "confirm-1", sourceHandle: "approved", targetHandle: "signal" },
  ],
};

// DeFi Yield Optimizer Demo Template
export const defiYieldOptimizerTemplate = {
  name: "DeFi Yield Optimizer Demo",
  description: "APY Monitor → Yield Optimizer Agent → Auto-rebalance for maximum yield. Demonstrates autonomous DeFi yield optimization.",
  category: "ai",
  difficulty: "Intermediate",
  featured: true,
  nodes: [
    {
      id: "apy-1",
      type: "apyMonitor",
      position: { x: 100, y: 200 },
      data: {
        label: "APY Monitor",
        node_data: {
          protocols: ["aave-v3", "compound-v3", "curve-3pool", "yearn-usdc"],
          asset: "USDC",
          minAPY: 2,
          useRealAPI: true,
          chain: "Ethereum"
        },
      },
    },
    {
      id: "yield-1",
      type: "yieldOptimizer",
      position: { x: 450, y: 200 },
      data: {
        label: "Yield Optimizer Agent",
        node_data: {
          currentProtocol: "aave-v3",
          depositAmount: "5000",
          minProfitThreshold: 0.5,
          gasPrice: "25",
          projectionMonths: 12
        },
      },
    },
    {
      id: "condition-1",
      type: "condition",
      position: { x: 750, y: 200 },
      data: {
        label: "Should Rebalance?",
        node_data: {
          condition: "shouldRebalance == true"
        },
      },
    },
    {
      id: "confirm-1",
      type: "userConfirmation",
      position: { x: 1000, y: 150 },
      data: {
        label: "Confirm Rebalance",
        node_data: {
          requireConfirmation: true,
          timeoutSeconds: 120,
          showDetails: true
        },
      },
    },
    {
      id: "print-1",
      type: "print",
      position: { x: 1000, y: 300 },
      data: {
        label: "Hold Position",
        node_data: { message: "Current position is optimal - holding" },
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "apy-1", target: "yield-1", sourceHandle: "apyData", targetHandle: "apyData" },
    { id: "e2-3", source: "yield-1", target: "condition-1", sourceHandle: "shouldRebalance", targetHandle: "price" },
    { id: "e3-4", source: "condition-1", target: "confirm-1", sourceHandle: "true-path", targetHandle: "trade", label: "Rebalance" },
    { id: "e3-5", source: "condition-1", target: "print-1", sourceHandle: "false-path", targetHandle: "test", label: "Hold" },
  ],
};

// Export all templates
import { additionalTemplates } from "./additionalTemplates";

export const allTemplates = [
  // AI Trading Templates (Featured for Hackathon)
  aiVisionTradingTemplate,
  defiYieldOptimizerTemplate,
  // Nexus x402 Templates (Featured)
  x402CryptoNewsTemplate,
  x402WeatherDataTemplate,
  x402AITradingTemplate,
  registryDiscoveryTemplate,
  // DeFi Templates
  buyTheDipTemplate,
  takeProfitTemplate,
  priceRangeAlertTemplate,
  // Additional Templates (Risk, Cross-Chain, AI, DeFi)
  ...additionalTemplates,
];

