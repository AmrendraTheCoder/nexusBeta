import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { parse_workflow } from "./json_parser/parser.js";
import { Workflow } from "./components/Workflow.js";
import type { WalletConfig } from "./interfaces/WalletConfig.js";
import {
  x402PaymentMiddleware,
  authorizeSessionBalance,
  getSessionBalanceEndpoint,
  initializeX402Server,
} from "./x402/paymentMiddleware.js";

dotenv.config();

const app = express();
const user_workflows: Record<string, Workflow> = {};

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://nexusflow.vercel.app',
    'https://nexusflowbeta.vercel.app',
    'https://nexusflow-frontend.vercel.app',
    // Allow any vercel.app subdomain for preview deployments
    /\.vercel\.app$/,
    // Allow all origins in development
    ...(process.env.NODE_ENV !== 'production' ? ['*'] : [])
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
};

// Enable CORS for all routes
app.use(cors(corsOptions));

app.use(express.json());

// x402 Payment endpoints
app.post("/x402/authorize", authorizeSessionBalance);
app.get("/x402/balance", getSessionBalanceEndpoint);

// Health check endpoint for Cloud Run
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "Server is running", timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/status", (req, res) => {
  const walletaddr = req.query.wallet as string;

  if (!walletaddr) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  if (user_workflows[walletaddr]) {
    const currentStatus = user_workflows[walletaddr].status;
    res.status(200).json({ currentNode: currentStatus });
  } else {
    res.status(404).json({ currentNode: null });
  }
});

/**
 * Create wallet configuration from request body or environment variables
 */
function createWalletConfig(requestBody: any): WalletConfig | undefined {
  const { walletConfig } = requestBody;

  // If wallet config is provided in request, use it
  if (walletConfig) {
    console.log(`📝 Using wallet config from request (mode: ${walletConfig.mode})`);
    return walletConfig as WalletConfig;
  }

  // Otherwise, try to create from environment variables (for backward compatibility)
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const chainId = parseInt(process.env.CHAIN_ID || "240");
  const delegateAddress = process.env.DELEGATE_CONTRACT_ADDRESS;

  if (privateKey && rpcUrl && delegateAddress) {
    console.log(`📝 Using wallet config from environment variables (direct mode)`);
    return {
      mode: "direct",
      privateKey: privateKey as `0x${string}`,
      chainId,
      rpcUrl,
      delegateAddress: delegateAddress as `0x${string}`,
    };
  }

  // No wallet config available
  console.log(`⚠️ No wallet configuration provided`);
  return undefined;
}

app.post("/workflow", x402PaymentMiddleware, async (req, res) => {
  try {
    const { json_workflow } = req.body;
    
    console.log("\n" + "=".repeat(60));
    console.log("🚀 NEW WORKFLOW REQUEST");
    console.log("=".repeat(60));
    console.log("📥 Raw request body:", JSON.stringify(req.body, null, 2));
    console.log("\n📋 Workflow Data:");
    console.log("   Wallet:", json_workflow.walletaddr);
    console.log("   Type:", json_workflow.type);
    console.log("   Nodes count:", Object.keys(json_workflow.nodes || {}).length);
    console.log("\n🔍 Individual Nodes:");
    
    for (const [nodeId, nodeData] of Object.entries(json_workflow.nodes || {})) {
      console.log(`\n   Node: ${nodeId}`);
      console.log(`   - Type: ${(nodeData as any).type}`);
      console.log(`   - Data:`, JSON.stringify(nodeData, null, 4));
    }

    // Create wallet configuration
    const walletConfig = createWalletConfig(req.body);

    if (walletConfig) {
      console.log("\n💼 Wallet Configuration:");
      console.log(`   Mode: ${walletConfig.mode}`);
      console.log(`   Chain ID: ${walletConfig.chainId}`);
      console.log(`   RPC: ${walletConfig.rpcUrl}`);
      console.log(`   Delegate: ${walletConfig.delegateAddress}`);
      if (walletConfig.mode === 'session-key') {
        console.log(`   Session Key: ${walletConfig.sessionKeyAddress}`);
        console.log(`   Owner: ${walletConfig.ownerAddress}`);
      }
    }

    // Parse workflow with wallet config
    const constructed_workflow: Workflow = parse_workflow(json_workflow, walletConfig);
    user_workflows[json_workflow.walletaddr] = constructed_workflow;

    // Start workflow execution (don't await - run in background)
    const repeatInterval = json_workflow.repeatInterval || 60000; // Default 1 minute
    console.log("\n▶️ Starting workflow execution...\n");
    if (json_workflow.type === "repeat") {
      console.log(`🔁 Repeat mode enabled - interval: ${repeatInterval / 1000}s`);
    }
    constructed_workflow.start(repeatInterval).catch(error => {
      console.error("Workflow execution error:", error);
      constructed_workflow.addLog('error', 'workflow', `Workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    });

    res.status(200).json({ 
      parsed: "Success",
      walletConfigMode: walletConfig?.mode || "none",
      message: "Workflow started. Use /logs endpoint to retrieve execution logs."
    });
  } catch (error) {
    console.error("\n❌ Error processing workflow:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/status", (req, res) => {
  const { walletaddr } = req.body;

  if (user_workflows[walletaddr]) {
    const currentStatus = user_workflows[walletaddr].status;
    res.status(200).json({ status: currentStatus });
  } else {
    console.log(`[STATUS POST] No workflow found for wallet: ${walletaddr}`);
    res
      .status(400)
      .json({ status: "No workflow for this wallet address found" });
  }
});

app.get("/logs/:walletaddr", (req, res) => {
  const { walletaddr } = req.params;

  if (user_workflows[walletaddr]) {
    res.status(200).json({ 
      logs: user_workflows[walletaddr].logs,
      status: user_workflows[walletaddr].status,
      isRunning: user_workflows[walletaddr].status !== ""
    });
  } else {
    res.status(404).json({ 
      error: "No workflow found for this wallet address",
      logs: []
    });
  }
});

app.post("/logs", (req, res) => {
  const { walletaddr } = req.body;

  if (user_workflows[walletaddr]) {
    res.status(200).json({ 
      logs: user_workflows[walletaddr].logs,
      status: user_workflows[walletaddr].status,
      isRunning: user_workflows[walletaddr].status !== ""
    });
  } else {
    res.status(404).json({ 
      error: "No workflow found for this wallet address",
      logs: []
    });
  }
});

app.post("/stop", (req, res) => {
  const { walletaddr } = req.body;

  if (user_workflows[walletaddr]) {
    console.log(`🛑 Stopping workflow for wallet: ${walletaddr}`);
    user_workflows[walletaddr].stop();
    res.status(200).json({ result: "Workflow stopped successfully" });
  } else {
    res
      .status(400)
      .json({ result: "No workflow for this wallet address found" });
  }
});

// New endpoint specifically for stopping workflows
app.post("/workflow/stop", (req, res) => {
  const { walletaddr, workflowId } = req.body;
  
  const key = workflowId || walletaddr;

  if (user_workflows[key]) {
    console.log(`🛑 Stopping automated workflow: ${key}`);
    user_workflows[key].stop();
    res.status(200).json({ 
      success: true, 
      message: "24/7 automated workflow stopped successfully" 
    });
  } else {
    res.status(404).json({ 
      success: false,
      error: "No workflow found for this identifier" 
    });
  }
});

// Get all active workflows
app.get("/workflows/active", (req, res) => {
  try {
    const activeWorkflows = [];
    const completedWorkflows = [];

    console.log(`[DEBUG] Checking user_workflows, total entries: ${Object.keys(user_workflows).length}`);

    for (const [id, workflow] of Object.entries(user_workflows)) {
      console.log(`[DEBUG] Workflow ${id}:`, {
        name: workflow.name,
        type: workflow.type,
        shouldStop: workflow.shouldStop,
        status: workflow.status,
        cycleCount: workflow.cycleCount,
        logsCount: workflow.logs?.length || 0
      });

      // A workflow is running if:
      // 1. It's a "repeat" type workflow AND hasn't been stopped
      // 2. OR it's executing right now (status !== "")
      const isRunning = (workflow.type === "repeat" && !workflow.shouldStop) || (workflow.status !== "");
      
      const workflowInfo = {
        id: id,
        name: workflow.name || "Unnamed Workflow",
        type: workflow.type || "once",
        status: workflow.status || (isRunning ? "waiting" : "completed"),
        startTime: workflow.startTime || new Date().toISOString(),
        cycleCount: workflow.cycleCount || 0,
        logs: workflow.logs || [],
        isRunning: isRunning
      };

      if (isRunning) {
        console.log(`[DEBUG] Adding to activeWorkflows: ${workflow.name}`);
        activeWorkflows.push(workflowInfo);
      } else {
        console.log(`[DEBUG] Adding to completedWorkflows: ${workflow.name}`);
        completedWorkflows.push({
          ...workflowInfo,
          endTime: new Date().toISOString(),
          duration: "N/A"
        });
      }
    }

    console.log(`[DEBUG] Returning: ${activeWorkflows.length} active, ${completedWorkflows.length} completed`);

    res.status(200).json({
      active: activeWorkflows,
      completed: completedWorkflows
    });
  } catch (error) {
    console.error("Error fetching active workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const port = parseInt(process.env.PORT || "8080", 10);

// Initialize x402 server before starting HTTP server
async function startServer() {
  // Initialize x402 first and wait for it to complete
  try {
    await initializeX402Server();
    console.log('[x402] ✅ Payment system initialized successfully');
  } catch (error) {
    console.error('[x402] ⚠️ Payment system initialization failed:', error);
    console.error('[x402] ⚠️ Server will start but payment processing may not work correctly');
  }

  // Now start the HTTP server
  const server = app.listen(port, "0.0.0.0", () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 D8N ENGINE SERVER");
    console.log("=".repeat(60));
    console.log(`Port: ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Chain ID: ${process.env.CHAIN_ID || "240 (default)"}`);
    console.log(`RPC URL: ${process.env.RPC_URL || "Not configured"}`);
    console.log(`Delegate Contract: ${process.env.DELEGATE_CONTRACT_ADDRESS || "Not configured"}`);
    console.log(`Session Key Manager: ${process.env.SESSION_KEY_MANAGER_ADDRESS || "Not configured"}`);
    console.log(`Gemini API: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Not configured"}`);
    console.log(`Started: ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");
  });

  return server;
}

// Start the server
startServer().then((s) => {
  server = s;
});

let server: any;

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (server) {
    server.close(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  if (server) {
    server.close(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;

// Build cache bust: 1768102800
