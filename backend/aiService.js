/**
 * AI Service for Text-to-DeFi Workflow Generation
 * Uses Google Gemini API to convert natural language prompts into workflow JSON
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Complete node configuration schema for the LLM - includes ALL available nodes
const NODE_SCHEMA = {
  // ========== PRICE & DATA NODES ==========
  "pyth-network": {
    description: "Fetches real-time price data from Pyth Network oracle. Use this as the starting point for price-based strategies.",
    inputs: { activate: "bool" },
    outputs: { price: "float" },
    node_data: { symbol: "BTC_USD" }, // Examples: BTC_USD, ETH_USD, SOL_USD, CRO_USD
  },
  
  // ========== AI TRADING NODES ==========
  visionAnalysis: {
    description: "AI Vision-powered chart analysis. Analyzes chart images using Gemini AI to detect patterns, support/resistance, and generate trading signals. IMPORTANT: This is the core AI analysis node.",
    inputs: { price: "float", imageUrl: "string" },
    outputs: { 
      analysis: "string",
      sentiment: "string", // bullish, bearish, neutral
      confidence: "float",
      patterns: "array",
      suggestedAction: "string", // buy, sell, hold, wait
      stopLoss: "float",
      takeProfit: "array",
      riskLevel: "string"
    },
    node_data: {
      prompt: "Analyze this BTC chart and provide trading recommendations",
      persona: "default", // aggressive, conservative, scalper, swing, contrarian, default
      analysisType: "chart", // chart, sentiment, pattern, custom
      outputFormat: "both", // signal, analysis, both
      apiProvider: "gemini", // gemini, openai, mock
    },
  },
  newsPrediction: {
    description: "Analyzes crypto news and correlates with historical price patterns to predict market moves. Great for sentiment-based trading.",
    inputs: { activate: "bool" },
    outputs: { 
      prediction: "object",
      signal: "string",
      sentiment: "string",
      sentimentScore: "float",
      predictedMove: "float",
      confidence: "float",
      shouldTrade: "bool",
      action: "string",
      reasoning: "array"
    },
    node_data: {
      symbol: "BTC",
      newsSource: "aggregated",
      lookbackHours: 24,
      minConfidence: 50,
      includePatternAnalysis: true,
    },
  },
  tradingAgent: {
    description: "AI-powered trading decision maker. Takes inputs from price feeds and analysis nodes, generates BUY/SELL/HOLD signals with risk parameters. This is the brain of the trading workflow.",
    inputs: { 
      prediction: "object",
      price: "float",
      analysis: "string",
      sentiment: "string",
      suggestedAction: "string"
    },
    outputs: { 
      signal: "object",
      action: "string", // buy, sell, hold
      shouldTrade: "bool",
      entryPrice: "float",
      stopLoss: "float",
      takeProfit: "float",
      positionSize: "string",
      reasoning: "string"
    },
    node_data: {
      symbol: "BTC",
      strategy: "ai-signal", // ai-signal, momentum, mean-reversion, dca
      riskLevel: "moderate", // conservative, moderate, aggressive
      maxPositionSize: "0.1",
      stopLossPercent: 5,
      takeProfitPercent: 10,
    },
  },
  
  // ========== RISK MANAGEMENT NODES ==========
  riskManager: {
    description: "Portfolio-level risk management. Validates trades against risk limits, position sizes, and daily loss limits. REQUIRED for safe trading.",
    inputs: { 
      signal: "object",
      action: "string",
      positionSize: "string"
    },
    outputs: { 
      approved: "bool",
      adjustedSize: "string",
      reason: "string",
      checks: "array"
    },
    node_data: {
      maxPortfolioRisk: 30,
      maxSinglePositionSize: 10,
      maxDailyLoss: 5,
      maxOpenPositions: 3,
      minBalanceReserve: 20,
      totalBalance: "1.0",
      availableBalance: "1.0",
    },
  },
  stopLoss: {
    description: "Monitors positions and triggers stop-loss or take-profit. Essential for protecting capital.",
    inputs: { price: "float", entryPrice: "float" },
    outputs: { 
      action: "string",
      shouldClose: "bool",
      pnlPercent: "float",
      reason: "string"
    },
    node_data: {
      symbol: "BTC",
      stopLossPrice: 0,
      takeProfitPrice: 0,
      positionType: "long",
      trailingStop: true,
      trailingPercent: 2,
    },
  },
  maxInvestment: {
    description: "Enforces maximum investment limits per trade. REQUIRED safety node.",
    inputs: { activate: "bool" },
    outputs: { 
      approved: "bool",
      adjustedAmount: "string",
      reason: "string"
    },
    node_data: {
      maxAmountPerTrade: "0.1",
      maxTotalExposure: "0.5",
      currency: "CRO",
    },
  },
  dailyLossLimit: {
    description: "Tracks and enforces daily loss limits. Pauses trading when limit is reached.",
    inputs: { currentPnL: "float" },
    outputs: { 
      canTrade: "bool",
      remainingBudget: "string",
      dailyLoss: "float"
    },
    node_data: {
      maxDailyLossPercent: 5,
      maxDailyLossAmount: "0.05",
      pauseOnLimit: true,
    },
  },
  userConfirmation: {
    description: "Requires user confirmation before executing trades. REQUIRED for safety.",
    inputs: { signal: "object", trade: "object" },
    outputs: { 
      confirmed: "bool",
      userResponse: "string"
    },
    node_data: {
      requireConfirmation: true,
      confirmationMethod: "popup",
      timeoutSeconds: 60,
    },
  },
  
  // ========== LOGIC NODES ==========
  condition: {
    description: "Evaluates a condition and routes to true-path or false-path. Use for if/else logic.",
    inputs: { price: "float", value: "any" },
    outputs: { "true-path": "bool", "false-path": "bool" },
    node_data: { condition: "price > 100000" }, // JS-like condition string
  },
  
  // ========== EXECUTION NODES ==========
  swap: {
    description: "Executes a token swap on DEX. Use for actual trade execution.",
    inputs: { activate: "bool" },
    outputs: { txHash: "string" },
    node_data: {
      tokenIn: "USDC",
      tokenOut: "WETH",
      amountIn: "100",
      amountOutMin: "0",
    },
  },
  limitOrder: {
    description: "Places a limit order. Good for precise entry points.",
    inputs: { activate: "bool" },
    outputs: { orderId: "string" },
    node_data: {
      makerToken: "USDC",
      takerToken: "WETH",
      makingAmount: "100",
      takingAmount: "0.05",
    },
  },
  sendToken: {
    description: "Sends tokens to an address.",
    inputs: { activate: "bool" },
    outputs: { txHash: "string" },
    node_data: { tokenAddress: "", destination: "", amount: "" },
  },
  queryBalance: {
    description: "Queries wallet token balance.",
    inputs: { activate: "bool" },
    outputs: { balance: "number" },
    node_data: { tokenAddress: "", walletAddress: "" },
  },
  
  // ========== DEFI YIELD NODES ==========
  apyMonitor: {
    description: "Monitors APY across DeFi protocols to find best yields.",
    inputs: { activate: "bool" },
    outputs: { 
      apyData: "array",
      bestProtocol: "string",
      bestAPY: "float",
      shouldRebalance: "bool"
    },
    node_data: {
      protocols: ["aave-v3", "compound-v3", "curve-3pool"],
      asset: "USDC",
      minAPY: 0,
    },
  },
  yieldOptimizer: {
    description: "AI agent that decides when to move funds between protocols for better yields.",
    inputs: { apyData: "array", bestAPY: "float" },
    outputs: { 
      action: "string",
      shouldRebalance: "bool",
      fromProtocol: "string",
      toProtocol: "string",
      expectedGainPercent: "float"
    },
    node_data: {
      currentProtocol: "aave-v3",
      depositAmount: "1000",
      minProfitThreshold: 0.5,
    },
  },
  
  // ========== ARBITRAGE NODES ==========
  arbitrage: {
    description: "Scans DEXes for arbitrage opportunities.",
    inputs: { activate: "bool" },
    outputs: { 
      opportunity: "object",
      shouldExecute: "bool",
      buyDex: "string",
      sellDex: "string",
      expectedProfit: "float"
    },
    node_data: {
      tokenIn: "USDC",
      tokenOut: "WETH",
      amount: "1000",
      dexes: ["uniswap", "sushiswap"],
      minProfitPercent: 0.5,
    },
  },
  crossChainArbitrage: {
    description: "Finds arbitrage opportunities across different blockchains.",
    inputs: { activate: "bool" },
    outputs: { 
      opportunity: "object",
      shouldExecute: "bool",
      executionSteps: "array"
    },
    node_data: {
      token: "ETH",
      amount: "1",
      chains: ["ethereum", "arbitrum", "optimism"],
      minProfitPercent: 0.5,
    },
  },
  
  // ========== UTILITY NODES ==========
  print: {
    description: "Debug node - prints values to console.",
    inputs: { value: "any" },
    outputs: {},
    node_data: {},
  },
  nexusPay: {
    description: "Calls a paid API using Nexus virtual balance (HTTP 402 payment).",
    inputs: { activate: "bool" },
    outputs: { data: "object", txHash: "string", cost: "string" },
    node_data: { url: "", chainId: 240 },
  },
};

// Strategy templates for common use cases
const STRATEGY_TEMPLATES = {
  "ai-trading": {
    description: "Full AI trading workflow with vision analysis, news sentiment, and risk management",
    nodes: ["pyth-network", "visionAnalysis", "newsPrediction", "tradingAgent", "riskManager", "userConfirmation"],
  },
  "price-alert": {
    description: "Simple price monitoring with condition-based alerts",
    nodes: ["pyth-network", "condition", "print"],
  },
  "dca": {
    description: "Dollar-cost averaging strategy",
    nodes: ["pyth-network", "condition", "maxInvestment", "swap"],
  },
  "yield-farming": {
    description: "Yield optimization across DeFi protocols",
    nodes: ["apyMonitor", "yieldOptimizer", "condition", "swap"],
  },
  "arbitrage": {
    description: "DEX arbitrage scanning and execution",
    nodes: ["arbitrage", "condition", "maxInvestment", "swap"],
  },
};

const SYSTEM_PROMPT = `You are an expert DeFi and AI trading workflow architect. Convert user requests into structured workflow JSON for the NexusFlow platform.

AVAILABLE NODE TYPES:
${JSON.stringify(NODE_SCHEMA, null, 2)}

STRATEGY TEMPLATES (use as reference):
${JSON.stringify(STRATEGY_TEMPLATES, null, 2)}

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown code blocks, no explanations, no extra text.
2. For AI trading strategies, ALWAYS include these nodes in order:
   - pyth-network (price feed)
   - visionAnalysis OR newsPrediction (AI analysis)
   - tradingAgent (decision making)
   - riskManager (risk validation)
   - userConfirmation (safety)
3. Connect nodes logically - outputs must match inputs.
4. Position nodes left-to-right with 300px horizontal spacing.
5. Use descriptive labels for each node.
6. Generate unique IDs like "node-1", "node-2", etc.
7. For conditions, use JavaScript-like syntax: "price > 100000", "sentiment === 'bullish'"

OUTPUT FORMAT (return EXACTLY this structure):
{
  "nodes": [
    {
      "id": "node-1",
      "type": "custom",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Human readable label",
        "type": "node-type-from-schema",
        "inputs": { "inputName": { "type": "inputType" } },
        "outputs": { "outputName": { "type": "outputType" } },
        "node_data": { ... configuration ... }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "outputName",
      "targetHandle": "inputName"
    }
  ]
}

EDGE CONNECTION RULES:
- pyth-network.price -> visionAnalysis.price, tradingAgent.price, condition.price
- visionAnalysis.suggestedAction -> tradingAgent.suggestedAction
- visionAnalysis.sentiment -> tradingAgent.sentiment
- visionAnalysis.analysis -> tradingAgent.analysis
- newsPrediction.prediction -> tradingAgent.prediction
- tradingAgent.signal -> riskManager.signal
- tradingAgent.action -> riskManager.action
- riskManager outputs -> userConfirmation.trade
- condition.true-path -> next node's activate input
- condition.false-path -> alternative path's activate input`;

// Enhanced fallback workflows for different strategies
const FALLBACK_WORKFLOWS = {
  "ai-trading": {
    nodes: [
      {
        id: "node-1",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          label: "Live BTC Price",
          type: "pyth-network",
          inputs: { activate: { type: "bool" } },
          outputs: { price: { type: "float" } },
          node_data: { symbol: "BTC_USD" },
        },
      },
      {
        id: "node-2",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          label: "AI Chart Analysis",
          type: "visionAnalysis",
          inputs: { price: { type: "float" } },
          outputs: { 
            analysis: { type: "string" },
            sentiment: { type: "string" },
            confidence: { type: "float" },
            suggestedAction: { type: "string" }
          },
          node_data: {
            prompt: "Analyze BTC chart for trading signals",
            persona: "default",
            analysisType: "chart",
            apiProvider: "gemini",
          },
        },
      },
      {
        id: "node-3",
        type: "custom",
        position: { x: 400, y: 280 },
        data: {
          label: "News Sentiment",
          type: "newsPrediction",
          inputs: { activate: { type: "bool" } },
          outputs: { 
            prediction: { type: "object" },
            sentiment: { type: "string" },
            confidence: { type: "float" }
          },
          node_data: {
            symbol: "BTC",
            newsSource: "aggregated",
            lookbackHours: 24,
          },
        },
      },
      {
        id: "node-4",
        type: "custom",
        position: { x: 750, y: 180 },
        data: {
          label: "Trading Decision",
          type: "tradingAgent",
          inputs: { 
            price: { type: "float" },
            prediction: { type: "object" },
            suggestedAction: { type: "string" }
          },
          outputs: { 
            signal: { type: "object" },
            action: { type: "string" },
            shouldTrade: { type: "bool" }
          },
          node_data: {
            symbol: "BTC",
            strategy: "ai-signal",
            riskLevel: "moderate",
            maxPositionSize: "0.1",
            stopLossPercent: 5,
            takeProfitPercent: 10,
          },
        },
      },
      {
        id: "node-5",
        type: "custom",
        position: { x: 1050, y: 180 },
        data: {
          label: "Risk Manager",
          type: "riskManager",
          inputs: { signal: { type: "object" }, action: { type: "string" } },
          outputs: { approved: { type: "bool" }, reason: { type: "string" } },
          node_data: {
            maxPortfolioRisk: 30,
            maxSinglePositionSize: 10,
            maxDailyLoss: 5,
            totalBalance: "1.0",
          },
        },
      },
      {
        id: "node-6",
        type: "custom",
        position: { x: 1350, y: 180 },
        data: {
          label: "User Confirmation",
          type: "userConfirmation",
          inputs: { signal: { type: "object" } },
          outputs: { confirmed: { type: "bool" } },
          node_data: {
            requireConfirmation: true,
            confirmationMethod: "popup",
            timeoutSeconds: 60,
          },
        },
      },
    ],
    edges: [
      { id: "edge-1-2", source: "node-1", target: "node-2", sourceHandle: "price", targetHandle: "price" },
      { id: "edge-1-3", source: "node-1", target: "node-3", sourceHandle: "price", targetHandle: "activate" },
      { id: "edge-1-4", source: "node-1", target: "node-4", sourceHandle: "price", targetHandle: "price" },
      { id: "edge-2-4", source: "node-2", target: "node-4", sourceHandle: "suggestedAction", targetHandle: "suggestedAction" },
      { id: "edge-3-4", source: "node-3", target: "node-4", sourceHandle: "prediction", targetHandle: "prediction" },
      { id: "edge-4-5", source: "node-4", target: "node-5", sourceHandle: "signal", targetHandle: "signal" },
      { id: "edge-5-6", source: "node-5", target: "node-6", sourceHandle: "approved", targetHandle: "signal" },
    ],
  },
  "price-condition": {
    nodes: [
      {
        id: "node-1",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          label: "ETH Price Feed",
          type: "pyth-network",
          inputs: { activate: { type: "bool" } },
          outputs: { price: { type: "float" } },
          node_data: { symbol: "ETH_USD" },
        },
      },
      {
        id: "node-2",
        type: "custom",
        position: { x: 400, y: 150 },
        data: {
          label: "Price Check",
          type: "condition",
          inputs: { price: { type: "float" } },
          outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
          node_data: { condition: "price < 3500" },
        },
      },
      {
        id: "node-3",
        type: "custom",
        position: { x: 700, y: 100 },
        data: {
          label: "Buy ETH",
          type: "swap",
          inputs: { activate: { type: "bool" } },
          outputs: { txHash: { type: "string" } },
          node_data: {
            tokenIn: "USDC",
            tokenOut: "WETH",
            amountIn: "100",
            amountOutMin: "0",
          },
        },
      },
    ],
    edges: [
      { id: "edge-1-2", source: "node-1", target: "node-2", sourceHandle: "price", targetHandle: "price" },
      { id: "edge-2-3", source: "node-2", target: "node-3", sourceHandle: "true-path", targetHandle: "activate" },
    ],
  },
  default: {
    nodes: [
      {
        id: "node-1",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          label: "BTC Price Feed",
          type: "pyth-network",
          inputs: { activate: { type: "bool" } },
          outputs: { price: { type: "float" } },
          node_data: { symbol: "BTC_USD" },
        },
      },
      {
        id: "node-2",
        type: "custom",
        position: { x: 400, y: 150 },
        data: {
          label: "Price Condition",
          type: "condition",
          inputs: { price: { type: "float" } },
          outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } },
          node_data: { condition: "price > 100000" },
        },
      },
      {
        id: "node-3",
        type: "custom",
        position: { x: 700, y: 100 },
        data: {
          label: "Execute Trade",
          type: "swap",
          inputs: { activate: { type: "bool" } },
          outputs: { txHash: { type: "string" } },
          node_data: {
            tokenIn: "USDC",
            tokenOut: "WBTC",
            amountIn: "100",
            amountOutMin: "0",
          },
        },
      },
    ],
    edges: [
      { id: "edge-1-2", source: "node-1", target: "node-2", sourceHandle: "price", targetHandle: "price" },
      { id: "edge-2-3", source: "node-2", target: "node-3", sourceHandle: "true-path", targetHandle: "activate" },
    ],
  },
};

/**
 * Detect the type of strategy from user prompt
 */
function detectStrategyType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("ai") || lowerPrompt.includes("trading") || lowerPrompt.includes("signal") || 
      lowerPrompt.includes("analysis") || lowerPrompt.includes("predict") || lowerPrompt.includes("sentiment")) {
    return "ai-trading";
  }
  if (lowerPrompt.includes("yield") || lowerPrompt.includes("apy") || lowerPrompt.includes("farm")) {
    return "yield-farming";
  }
  if (lowerPrompt.includes("arbitrage") || lowerPrompt.includes("arb")) {
    return "arbitrage";
  }
  if (lowerPrompt.includes("dca") || lowerPrompt.includes("dollar cost") || lowerPrompt.includes("average")) {
    return "dca";
  }
  if (lowerPrompt.includes("price") && (lowerPrompt.includes("below") || lowerPrompt.includes("above") || lowerPrompt.includes("when"))) {
    return "price-condition";
  }
  
  return "default";
}

/**
 * Generate workflow from natural language prompt using Gemini
 * @param {string} userPrompt - Natural language description of the workflow
 * @returns {Promise<{success: boolean, workflow: object, mode: string, message?: string}>}
 */
async function generateWorkflowFromPrompt(userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const strategyType = detectStrategyType(userPrompt);

  console.log(`[AI Service] Detected strategy type: ${strategyType}`);
  console.log(`[AI Service] User prompt: "${userPrompt.substring(0, 100)}..."`);

  // If no API key, return appropriate fallback
  if (!apiKey) {
    console.warn("[AI Service] No GEMINI_API_KEY found - using fallback workflow");
    const fallback = FALLBACK_WORKFLOWS[strategyType] || FALLBACK_WORKFLOWS.default;
    
    // Add timestamps to make IDs unique
    const timestamp = Date.now();
    const workflow = JSON.parse(JSON.stringify(fallback));
    workflow.nodes = workflow.nodes.map((node, index) => ({
      ...node,
      id: `ai-${timestamp}-${index}`,
    }));
    workflow.edges = workflow.edges.map((edge, index) => ({
      ...edge,
      id: `ai-edge-${timestamp}-${index}`,
      source: `ai-${timestamp}-${parseInt(edge.source.split('-')[1]) - 1}`,
      target: `ai-${timestamp}-${parseInt(edge.target.split('-')[1]) - 1}`,
    }));
    
    return {
      success: true,
      workflow,
      mode: "fallback",
      strategyType,
      message: "No API key configured. Using pre-built AI trading workflow. Add GEMINI_API_KEY for custom AI generation.",
    };
  }

  try {
    console.log("[AI Service] Generating workflow with Gemini AI...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const prompt = `${SYSTEM_PROMPT}

USER REQUEST: ${userPrompt}

DETECTED STRATEGY TYPE: ${strategyType}

Generate the workflow JSON now (remember: NO markdown, NO code blocks, ONLY raw JSON):`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("[AI Service] Raw response length:", responseText.length);

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }
    
    // Remove any leading/trailing non-JSON characters
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const workflow = JSON.parse(jsonStr);

    // Validate structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error("Invalid workflow structure: missing nodes array");
    }

    if (workflow.nodes.length === 0) {
      throw new Error("Invalid workflow: no nodes generated");
    }

    // Add timestamps to node IDs to ensure uniqueness
    const timestamp = Date.now();
    const idMap = {};
    
    workflow.nodes = workflow.nodes.map((node, index) => {
      const oldId = node.id;
      const newId = `ai-${timestamp}-${index}`;
      idMap[oldId] = newId;
      return {
        ...node,
        id: newId,
      };
    });

    // Update edge references
    workflow.edges = (workflow.edges || []).map((edge, index) => ({
      ...edge,
      id: `ai-edge-${timestamp}-${index}`,
      source: idMap[edge.source] || edge.source,
      target: idMap[edge.target] || edge.target,
    }));

    console.log(`[AI Service] ✅ Generated workflow with ${workflow.nodes.length} nodes using Gemini AI`);

    return {
      success: true,
      workflow,
      mode: "ai",
      strategyType,
    };
  } catch (error) {
    console.error("[AI Service] Gemini API error:", error.message);
    
    // Return appropriate fallback based on detected strategy
    const fallback = FALLBACK_WORKFLOWS[strategyType] || FALLBACK_WORKFLOWS.default;
    
    // Add timestamps to make IDs unique
    const timestamp = Date.now();
    const workflow = JSON.parse(JSON.stringify(fallback));
    workflow.nodes = workflow.nodes.map((node, index) => ({
      ...node,
      id: `ai-${timestamp}-${index}`,
    }));
    
    // Fix edge references for fallback
    workflow.edges = workflow.edges.map((edge, index) => {
      const sourceIndex = parseInt(edge.source.split('-')[1]) - 1;
      const targetIndex = parseInt(edge.target.split('-')[1]) - 1;
      return {
        ...edge,
        id: `ai-edge-${timestamp}-${index}`,
        source: `ai-${timestamp}-${sourceIndex}`,
        target: `ai-${timestamp}-${targetIndex}`,
      };
    });
    
    return {
      success: true,
      error: error.message,
      workflow,
      mode: "fallback",
      strategyType,
      message: `AI generation encountered an issue. Using pre-built ${strategyType} workflow instead.`,
    };
  }
}

module.exports = {
  generateWorkflowFromPrompt,
  NODE_SCHEMA,
  STRATEGY_TEMPLATES,
  FALLBACK_WORKFLOWS,
};
