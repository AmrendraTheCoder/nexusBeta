/**
 * AI Service for Text-to-DeFi Workflow Generation
 * Uses Google Gemini API to convert natural language prompts into workflow JSON
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Node configuration schema for the LLM
const NODE_SCHEMA = {
  "pyth-network": {
    description: "Fetches real-time price data from Pyth Network oracle",
    inputs: { activate: "bool" },
    outputs: { price: "float" },
    node_data: { symbol: "ETH_USD" }, // Examples: BTC_USD, SOL_USD, etc.
  },
  condition: {
    description: "Evaluates a condition and routes to true-path or false-path",
    inputs: { price: "float" },
    outputs: { "true-path": "bool", "false-path": "bool" },
    node_data: { condition: "price > 100000" }, // JS-like condition string
  },
  swap: {
    description: "Executes a token swap using 1inch aggregator",
    inputs: { activate: "bool" },
    outputs: {},
    node_data: {
      tokenIn: "0x...", // Token address to sell
      tokenOut: "0x...", // Token address to buy
      amountIn: "1000000", // Amount in smallest units
      amountOutMin: "0",
    },
  },
  limitOrder: {
    description: "Places a limit order on 1inch protocol",
    inputs: { activate: "bool" },
    outputs: {},
    node_data: {
      makerToken: "0x...",
      takerToken: "0x...",
      makingAmount: "",
      takingAmount: "",
    },
  },
  queryBalance: {
    description: "Queries the token balance of a wallet",
    inputs: { activate: "bool" },
    outputs: { balance: "number" },
    node_data: { tokenAddress: "", walletAddress: "" },
  },
  sendToken: {
    description: "Sends tokens to a specified address",
    inputs: { activate: "bool" },
    outputs: { txHash: "string" },
    node_data: { tokenAddress: "", destination: "", amount: "" },
  },
  nexusPay: {
    description: "Calls a 402 paid API using Nexus virtual balance",
    inputs: { activate: "bool" },
    outputs: { data: "object", txHash: "string", cost: "string" },
    node_data: { url: "", chainId: 240 },
  },
};

const SYSTEM_PROMPT = `You are an expert DeFi workflow architect. Convert user requests into structured workflow JSON.

Available node types and their schemas:
${JSON.stringify(NODE_SCHEMA, null, 2)}

RULES:
1. Return ONLY valid JSON, no markdown, no explanations.
2. Use realistic token addresses for testnets (use 0x placeholders if unknown).
3. Always start with a trigger node (pyth-network for price-based, queryBalance for balance-based).
4. Use "condition" nodes for if/else logic.
5. Connect nodes logically - outputs should flow to inputs.
6. Position nodes left-to-right with 300px spacing.
7. Generate unique IDs like "node-1", "node-2", etc.

OUTPUT FORMAT:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "custom",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Human readable label",
        "type": "node-type-from-schema",
        "inputs": { ... },
        "outputs": { ... },
        "node_data": { ... }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "price",
      "targetHandle": "price"
    }
  ]
}`;

// Fallback workflow - only used if Gemini API is completely unavailable
const FALLBACK_WORKFLOWS = {
  default: {
    nodes: [
      {
        id: "ai-node-1",
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
        id: "ai-node-2",
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
        id: "ai-node-3",
        type: "custom",
        position: { x: 700, y: 100 },
        data: {
          label: "Swap USDC to ETH",
          type: "swap",
          inputs: { activate: { type: "bool" } },
          outputs: {},
          node_data: {
            tokenIn: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            tokenOut: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
            amountIn: "100000000",
            amountOutMin: "0",
          },
        },
      },
    ],
    edges: [
      { id: "edge-1-2", source: "ai-node-1", target: "ai-node-2", sourceHandle: "price", targetHandle: "price" },
      { id: "edge-2-3", source: "ai-node-2", target: "ai-node-3", sourceHandle: "true-path", targetHandle: "activate" },
    ],
  },
};

/**
 * Generate workflow from natural language prompt using Gemini
 * @param {string} userPrompt - Natural language description of the workflow
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
async function generateWorkflowFromPrompt(userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Warn if no API key but still try to generate
  if (!apiKey) {
    console.warn("[AI Service] No GEMINI_API_KEY found - using fallback workflow");
    return {
      success: true,
      workflow: FALLBACK_WORKFLOWS.default,
      mode: "fallback",
      message: "No API key configured. Add GEMINI_API_KEY for real AI generation.",
    };
  }

  try {
    console.log("[AI Service] Generating workflow with Gemini AI...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `${SYSTEM_PROMPT}

USER REQUEST: ${userPrompt}

Generate the workflow JSON:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = responseText;
    if (responseText.includes("```json")) {
      jsonStr = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonStr = responseText.split("```")[1].split("```")[0].trim();
    }

    const workflow = JSON.parse(jsonStr);

    // Validate structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error("Invalid workflow structure: missing nodes array");
    }

    // Add timestamps to node IDs to ensure uniqueness
    const timestamp = Date.now();
    workflow.nodes = workflow.nodes.map((node, index) => ({
      ...node,
      id: `ai-${timestamp}-${index}`,
    }));

    // Update edge references
    const idMap = {};
    workflow.nodes.forEach((node, index) => {
      const oldId = `node-${index + 1}`;
      idMap[oldId] = node.id;
    });

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
    };
  } catch (error) {
    console.error("[AI Service] Gemini API error:", error.message);
    return {
      success: false,
      error: error.message,
      workflow: FALLBACK_WORKFLOWS.default,
      mode: "fallback",
      message: "AI generation failed, returning fallback workflow.",
    };
  }
}

module.exports = {
  generateWorkflowFromPrompt,
  NODE_SCHEMA,
};
