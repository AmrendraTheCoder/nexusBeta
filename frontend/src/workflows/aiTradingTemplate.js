/**
 * AI Trading Workflow Templates
 * Pre-built workflows for automated trading with risk management
 */

export const AI_TRADING_TEMPLATES = {
  // Simple AI Signal Trading
  simpleAITrading: {
    name: "Simple AI Trading",
    description: "Basic AI-powered trading with stop-loss protection",
    risk: "moderate",
    nodes: [
      {
        id: "ai-pred-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          label: "Get AI Prediction",
          type: "aiPrediction",
          inputs: { activate: { type: "bool" } },
          outputs: { prediction: { type: "object" }, currentPrice: { type: "float" }, sentiment: { type: "string" } },
          node_data: {
            symbol: "BTC",
            apiUrl: "http://localhost:4000/api/predictions/btc",
            provider: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            paymentAmount: "1000000000000000",
            chainId: 240,
            nexusBackendUrl: "http://localhost:3001",
          },
        },
      },
      {
        id: "agent-1",
        type: "custom",
        position: { x: 100, y: 280 },
        data: {
          label: "AI Trading Agent",
          type: "tradingAgent",
          inputs: { prediction: { type: "object" }, price: { type: "float" } },
          outputs: { signal: { type: "object" }, action: { type: "string" }, shouldTrade: { type: "bool" } },
          node_data: {
            symbol: "BTC",
            strategy: "ai-signal",
            riskLevel: "moderate",
            maxPositionSize: "0.1",
            stopLossPercent: 5,
            takeProfitPercent: 10,
            maxDailyLoss: "0.05",
          },
        },
      },
      {
        id: "cond-1",
        type: "custom",
        position: { x: 100, y: 460 },
        data: {
          label: "Should Trade?",
          type: "condition",
          inputs: { shouldTrade: { type: "bool" } },
          outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
          node_data: {
            leftVariable: "shouldTrade",
            operator: "equals",
            rightValue: "true",
          },
        },
      },
      {
        id: "print-trade",
        type: "custom",
        position: { x: -100, y: 640 },
        data: {
          label: "Log Trade Signal",
          type: "print",
          inputs: { test: { type: "float" } },
          outputs: {},
          node_data: {
            message: "🚀 Trade Signal: ${action} at $${entryPrice}, SL: $${stopLoss}, TP: $${takeProfit}",
          },
        },
      },
      {
        id: "print-hold",
        type: "custom",
        position: { x: 300, y: 640 },
        data: {
          label: "Log Hold",
          type: "print",
          inputs: { test: { type: "float" } },
          outputs: {},
          node_data: {
            message: "📊 Holding - No strong signal detected",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "ai-pred-1", target: "agent-1", sourceHandle: "prediction", targetHandle: "prediction" },
      { id: "e2", source: "ai-pred-1", target: "agent-1", sourceHandle: "currentPrice", targetHandle: "price" },
      { id: "e3", source: "agent-1", target: "cond-1", sourceHandle: "shouldTrade", targetHandle: "shouldTrade" },
      { id: "e4", source: "cond-1", target: "print-trade", sourceHandle: "true-path", targetHandle: "activate" },
      { id: "e5", source: "cond-1", target: "print-hold", sourceHandle: "false-path", targetHandle: "activate" },
    ],
  },

  // Full Risk-Managed Trading
  fullRiskManagedTrading: {
    name: "Risk-Managed AI Trading",
    description: "Complete trading workflow with risk management and position monitoring",
    risk: "low",
    nodes: [
      {
        id: "pred-1",
        type: "custom",
        position: { x: 100, y: 50 },
        data: {
          label: "Fetch AI Prediction",
          type: "aiPrediction",
          inputs: { activate: { type: "bool" } },
          outputs: { prediction: { type: "object" }, currentPrice: { type: "float" }, sentiment: { type: "string" } },
          node_data: {
            symbol: "BTC",
            apiUrl: "http://localhost:4000/api/predictions/btc",
            provider: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            paymentAmount: "1000000000000000",
            chainId: 240,
            nexusBackendUrl: "http://localhost:3001",
          },
        },
      },
      {
        id: "agent-1",
        type: "custom",
        position: { x: 100, y: 200 },
        data: {
          label: "Trading Agent",
          type: "tradingAgent",
          inputs: { prediction: { type: "object" }, price: { type: "float" } },
          outputs: { signal: { type: "object" }, action: { type: "string" }, positionSize: { type: "string" } },
          node_data: {
            symbol: "BTC",
            strategy: "ai-signal",
            riskLevel: "conservative",
            maxPositionSize: "0.2",
            stopLossPercent: 3,
            takeProfitPercent: 8,
            maxDailyLoss: "0.05",
          },
        },
      },
      {
        id: "risk-1",
        type: "custom",
        position: { x: 100, y: 350 },
        data: {
          label: "Risk Manager",
          type: "riskManager",
          inputs: { signal: { type: "object" } },
          outputs: { approved: { type: "bool" }, adjustedSize: { type: "string" }, reason: { type: "string" } },
          node_data: {
            maxPortfolioRisk: 20,
            maxSinglePositionSize: 5,
            maxDailyLoss: 3,
            maxOpenPositions: 2,
            minBalanceReserve: 30,
            totalBalance: "1.0",
            availableBalance: "1.0",
            openPositions: 0,
            dailyPnL: 0,
            totalExposure: 0,
          },
        },
      },
      {
        id: "cond-approved",
        type: "custom",
        position: { x: 100, y: 500 },
        data: {
          label: "Trade Approved?",
          type: "condition",
          inputs: { approved: { type: "bool" } },
          outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
          node_data: {
            leftVariable: "approved",
            operator: "equals",
            rightValue: "true",
          },
        },
      },
      {
        id: "cond-buy",
        type: "custom",
        position: { x: -100, y: 650 },
        data: {
          label: "Is Buy?",
          type: "condition",
          inputs: { action: { type: "string" } },
          outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
          node_data: {
            leftVariable: "action",
            operator: "equals",
            rightValue: "'buy'",
          },
        },
      },
      {
        id: "print-buy",
        type: "custom",
        position: { x: -200, y: 800 },
        data: {
          label: "Execute Buy",
          type: "print",
          inputs: {},
          outputs: {},
          node_data: {
            message: "✅ BUY executed: Size ${adjustedSize}, Entry $${entryPrice}, SL $${stopLoss}, TP $${takeProfit}",
          },
        },
      },
      {
        id: "print-sell",
        type: "custom",
        position: { x: 0, y: 800 },
        data: {
          label: "Execute Sell",
          type: "print",
          inputs: {},
          outputs: {},
          node_data: {
            message: "✅ SELL executed: Size ${adjustedSize}, Entry $${entryPrice}, SL $${stopLoss}, TP $${takeProfit}",
          },
        },
      },
      {
        id: "print-rejected",
        type: "custom",
        position: { x: 300, y: 650 },
        data: {
          label: "Trade Rejected",
          type: "print",
          inputs: {},
          outputs: {},
          node_data: {
            message: "⚠️ Trade rejected by risk manager: ${reason}",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "pred-1", target: "agent-1" },
      { id: "e2", source: "agent-1", target: "risk-1" },
      { id: "e3", source: "risk-1", target: "cond-approved" },
      { id: "e4", source: "cond-approved", target: "cond-buy", sourceHandle: "true-path" },
      { id: "e5", source: "cond-approved", target: "print-rejected", sourceHandle: "false-path" },
      { id: "e6", source: "cond-buy", target: "print-buy", sourceHandle: "true-path" },
      { id: "e7", source: "cond-buy", target: "print-sell", sourceHandle: "false-path" },
    ],
  },

  // DCA Strategy
  dcaStrategy: {
    name: "Dollar Cost Averaging",
    description: "Automated DCA strategy with price-based triggers",
    risk: "low",
    nodes: [
      {
        id: "pyth-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          label: "BTC Price Feed",
          type: "pyth-network",
          inputs: { activate: { type: "bool" } },
          outputs: { price: { type: "float" } },
          node_data: { symbol: "BTC_USD" },
        },
      },
      {
        id: "agent-dca",
        type: "custom",
        position: { x: 100, y: 280 },
        data: {
          label: "DCA Agent",
          type: "tradingAgent",
          inputs: { price: { type: "float" } },
          outputs: { signal: { type: "object" }, action: { type: "string" } },
          node_data: {
            symbol: "BTC",
            strategy: "dca",
            riskLevel: "conservative",
            maxPositionSize: "0.05",
            stopLossPercent: 10,
            takeProfitPercent: 20,
            maxDailyLoss: "0.02",
          },
        },
      },
      {
        id: "risk-dca",
        type: "custom",
        position: { x: 100, y: 460 },
        data: {
          label: "Risk Check",
          type: "riskManager",
          inputs: { signal: { type: "object" } },
          outputs: { approved: { type: "bool" }, adjustedSize: { type: "string" } },
          node_data: {
            maxPortfolioRisk: 50,
            maxSinglePositionSize: 5,
            maxDailyLoss: 2,
            maxOpenPositions: 10,
            minBalanceReserve: 10,
            totalBalance: "1.0",
            availableBalance: "1.0",
          },
        },
      },
      {
        id: "print-dca",
        type: "custom",
        position: { x: 100, y: 640 },
        data: {
          label: "Log DCA Purchase",
          type: "print",
          inputs: {},
          outputs: {},
          node_data: {
            message: "📈 DCA Purchase: ${adjustedSize} at $${entryPrice}",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "pyth-1", target: "agent-dca", sourceHandle: "price", targetHandle: "price" },
      { id: "e2", source: "agent-dca", target: "risk-dca" },
      { id: "e3", source: "risk-dca", target: "print-dca" },
    ],
  },
};

export default AI_TRADING_TEMPLATES;
