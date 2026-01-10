import { tokens } from "./tokenMappings";

// ============================================
// RISK MANAGEMENT TEMPLATES
// ============================================

export const healthFactorMonitorTemplate = {
  name: "Aave Health Monitor",
  description: "Monitor Aave position health factor and alert on risk.",
  category: "risk",
  difficulty: "Intermediate",
  nodes: [
    { id: "hf-1", type: "healthFactor", position: { x: 100, y: 150 }, data: { label: "Check Health Factor", node_data: { protocol: "aave", threshold: "1.5" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "HF < 1.5?", node_data: { condition: "healthFactor < 1.5" } } },
    { id: "alert-1", type: "liquidationAlert", position: { x: 700, y: 80 }, data: { label: "Send Alert", node_data: { warningThreshold: "1.5" } } },
    { id: "print-1", type: "print", position: { x: 700, y: 220 }, data: { label: "Position Safe", node_data: { sample: "Health factor is healthy" } } },
  ],
  edges: [
    { id: "e1", source: "hf-1", target: "cond-1", sourceHandle: "healthFactor", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "alert-1", sourceHandle: "true-path", targetHandle: "healthFactor", label: "True" },
    { id: "e3", source: "cond-1", target: "print-1", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

export const autoRepayTemplate = {
  name: "Auto Repay on Low Health",
  description: "Automatically repay loan when health factor drops below threshold.",
  category: "risk",
  difficulty: "Advanced",
  featured: true,
  nodes: [
    { id: "hf-1", type: "healthFactor", position: { x: 100, y: 150 }, data: { label: "Monitor Health", node_data: { protocol: "aave", threshold: "1.2" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "HF < 1.2?", node_data: { condition: "healthFactor < 1.2" } } },
    { id: "repay-1", type: "autoRepay", position: { x: 700, y: 150 }, data: { label: "Auto Repay 50%", node_data: { protocol: "aave", repayPercentage: "50" } } },
  ],
  edges: [
    { id: "e1", source: "hf-1", target: "cond-1", sourceHandle: "healthFactor", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "repay-1", sourceHandle: "true-path", targetHandle: "healthFactor", label: "True" },
  ],
};

// ============================================
// CROSS-CHAIN TEMPLATES
// ============================================

export const crossChainSwapTemplate = {
  name: "Cross-Chain Arbitrage",
  description: "Execute swaps across different chains for arbitrage.",
  category: "crosschain",
  difficulty: "Advanced",
  nodes: [
    { id: "pyth-1", type: "pyth-network", position: { x: 100, y: 150 }, data: { label: "ETH Price", node_data: { symbol: "ETH_USD" } } },
    { id: "cc-1", type: "crossChainTrigger", position: { x: 400, y: 150 }, data: { label: "Bridge to Base", node_data: { sourceChain: 11155111, destinationChain: 84532, protocol: "ccip" } } },
    { id: "swap-1", type: "crossChainSwap", position: { x: 700, y: 150 }, data: { label: "Swap on Base", node_data: { destinationChain: 84532 } } },
  ],
  edges: [
    { id: "e1", source: "pyth-1", target: "cc-1", sourceHandle: "price", targetHandle: "activate" },
    { id: "e2", source: "cc-1", target: "swap-1", sourceHandle: "messageId", targetHandle: "activate" },
  ],
};

export const multiChainBalanceTemplate = {
  name: "Multi-Chain Balance Check",
  description: "Query balances across multiple chains and consolidate.",
  category: "crosschain",
  difficulty: "Intermediate",
  nodes: [
    { id: "bal-1", type: "queryBalance", position: { x: 100, y: 100 }, data: { label: "Ethereum Balance", node_data: {} } },
    { id: "bal-2", type: "queryBalance", position: { x: 100, y: 250 }, data: { label: "Base Balance", node_data: {} } },
    { id: "print-1", type: "print", position: { x: 400, y: 175 }, data: { label: "Total Portfolio", node_data: { sample: "Combined balances" } } },
  ],
  edges: [
    { id: "e1", source: "bal-1", target: "print-1", sourceHandle: "balance", targetHandle: "test" },
    { id: "e2", source: "bal-2", target: "print-1", sourceHandle: "balance", targetHandle: "test" },
  ],
};

// ============================================
// AI & AUTOMATION TEMPLATES
// ============================================

export const aiSentimentTradingTemplate = {
  name: "AI Sentiment Trading",
  description: "Trade based on AI-analyzed market sentiment.",
  category: "ai",
  difficulty: "Advanced",
  featured: true,
  nodes: [
    { id: "nexus-1", type: "nexusPay", position: { x: 100, y: 150 }, data: { label: "Get AI Sentiment", node_data: { url: "http://localhost:4000/api/ai/sentiment" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "Bullish?", node_data: { condition: "price > 0.7" } } },
    { id: "swap-1", type: "swap", position: { x: 700, y: 80 }, data: { label: "Buy ETH", node_data: { tokenIn: tokens.USDC.address, tokenOut: tokens.WETH.address } } },
    { id: "print-1", type: "print", position: { x: 700, y: 220 }, data: { label: "Wait", node_data: { sample: "Sentiment not bullish" } } },
  ],
  edges: [
    { id: "e1", source: "nexus-1", target: "cond-1", sourceHandle: "data", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e3", source: "cond-1", target: "print-1", sourceHandle: "false-path", targetHandle: "test", label: "False" },
  ],
};

// ============================================
// DeFi STRATEGY TEMPLATES
// ============================================

export const dollarCostAverageTemplate = {
  name: "Dollar Cost Average (DCA)",
  description: "Regularly purchase ETH regardless of price for long-term accumulation.",
  category: "defi",
  difficulty: "Beginner",
  nodes: [
    { id: "bal-1", type: "queryBalance", position: { x: 100, y: 150 }, data: { label: "Check USDC", node_data: {} } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "Balance > $100?", node_data: { condition: "balance > 100" } } },
    { id: "swap-1", type: "swap", position: { x: 700, y: 150 }, data: { label: "Buy $100 ETH", node_data: { tokenIn: tokens.USDC.address, tokenOut: tokens.WETH.address, amountIn: "100000000" } } },
  ],
  edges: [
    { id: "e1", source: "bal-1", target: "cond-1", sourceHandle: "balance", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

export const stopLossTemplate = {
  name: "Stop Loss Order",
  description: "Automatically sell if price drops below threshold.",
  category: "defi",
  difficulty: "Intermediate",
  nodes: [
    { id: "pyth-1", type: "pyth-network", position: { x: 100, y: 150 }, data: { label: "ETH Price", node_data: { symbol: "ETH_USD" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "Price < $3000?", node_data: { condition: "price < 3000" } } },
    { id: "swap-1", type: "swap", position: { x: 700, y: 150 }, data: { label: "Sell to USDC", node_data: { tokenIn: tokens.WETH.address, tokenOut: tokens.USDC.address } } },
  ],
  edges: [
    { id: "e1", source: "pyth-1", target: "cond-1", sourceHandle: "price", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

export const takeProfitOrderTemplate = {
  name: "Take Profit Order",
  description: "Sell when price reaches profit target.",
  category: "defi",
  difficulty: "Intermediate",
  nodes: [
    { id: "pyth-1", type: "pyth-network", position: { x: 100, y: 150 }, data: { label: "ETH Price", node_data: { symbol: "ETH_USD" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "Price > $5000?", node_data: { condition: "price > 5000" } } },
    { id: "swap-1", type: "swap", position: { x: 700, y: 150 }, data: { label: "Take Profit", node_data: { tokenIn: tokens.WETH.address, tokenOut: tokens.USDC.address } } },
  ],
  edges: [
    { id: "e1", source: "pyth-1", target: "cond-1", sourceHandle: "price", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

export const rangeTradeTemplate = {
  name: "Range Trading Bot",
  description: "Buy at support, sell at resistance levels.",
  category: "defi",
  difficulty: "Advanced",
  nodes: [
    { id: "pyth-1", type: "pyth-network", position: { x: 100, y: 175 }, data: { label: "ETH Price", node_data: { symbol: "ETH_USD" } } },
    { id: "cond-buy", type: "condition", position: { x: 400, y: 100 }, data: { label: "Price < $3500?", node_data: { condition: "price < 3500" } } },
    { id: "cond-sell", type: "condition", position: { x: 400, y: 250 }, data: { label: "Price > $4500?", node_data: { condition: "price > 4500" } } },
    { id: "swap-buy", type: "swap", position: { x: 700, y: 100 }, data: { label: "Buy ETH", node_data: {} } },
    { id: "swap-sell", type: "swap", position: { x: 700, y: 250 }, data: { label: "Sell ETH", node_data: {} } },
  ],
  edges: [
    { id: "e1", source: "pyth-1", target: "cond-buy", sourceHandle: "price", targetHandle: "price" },
    { id: "e2", source: "pyth-1", target: "cond-sell", sourceHandle: "price", targetHandle: "price" },
    { id: "e3", source: "cond-buy", target: "swap-buy", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
    { id: "e4", source: "cond-sell", target: "swap-sell", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

export const rebalancePortfolioTemplate = {
  name: "Portfolio Rebalancer",
  description: "Automatically rebalance to target allocations.",
  category: "defi",
  difficulty: "Advanced",
  nodes: [
    { id: "bal-1", type: "queryBalance", position: { x: 100, y: 100 }, data: { label: "ETH Balance", node_data: {} } },
    { id: "bal-2", type: "queryBalance", position: { x: 100, y: 250 }, data: { label: "USDC Balance", node_data: {} } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 175 }, data: { label: "ETH > 60%?", node_data: { condition: "price > 0.6" } } },
    { id: "swap-1", type: "swap", position: { x: 700, y: 175 }, data: { label: "Rebalance", node_data: {} } },
  ],
  edges: [
    { id: "e1", source: "bal-1", target: "cond-1", sourceHandle: "balance", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "swap-1", sourceHandle: "true-path", targetHandle: "activate", label: "True" },
  ],
};

export const yieldFarmingTemplate = {
  name: "Auto Yield Farming",
  description: "Move funds to highest yield protocol.",
  category: "defi",
  difficulty: "Advanced",
  nodes: [
    { id: "nexus-1", type: "nexusPay", position: { x: 100, y: 150 }, data: { label: "Get Yield Rates", node_data: { url: "http://localhost:4000/api/yields" } } },
    { id: "cond-1", type: "condition", position: { x: 400, y: 150 }, data: { label: "APY > 10%?", node_data: { condition: "price > 10" } } },
    { id: "print-1", type: "print", position: { x: 700, y: 150 }, data: { label: "Deposit", node_data: { sample: "Depositing to high yield" } } },
  ],
  edges: [
    { id: "e1", source: "nexus-1", target: "cond-1", sourceHandle: "data", targetHandle: "price" },
    { id: "e2", source: "cond-1", target: "print-1", sourceHandle: "true-path", targetHandle: "test", label: "True" },
  ],
};

// Export new templates
export const additionalTemplates = [
  healthFactorMonitorTemplate,
  autoRepayTemplate,
  crossChainSwapTemplate,
  multiChainBalanceTemplate,
  aiSentimentTradingTemplate,
  dollarCostAverageTemplate,
  stopLossTemplate,
  takeProfitOrderTemplate,
  rangeTradeTemplate,
  rebalancePortfolioTemplate,
  yieldFarmingTemplate,
];
