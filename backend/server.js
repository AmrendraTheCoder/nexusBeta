// Load environment variables FIRST (before any other imports that use them)
require("dotenv").config();

const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const { generateWorkflowFromPrompt } = require("./aiService");
const { startDepositListener, getListenerStatus } = require("./depositListener");
const nexusRegistryAbi = require("./abis/nexusRegistryAbi");

const app = express();

// MongoDB connection
const uri = process.env.MONGO_URI || 
  "mongodb+srv://harshitacademia_db_user:i9B8EJejeTvBZEQw@decluster8n.htjwxef.mongodb.net/?retryWrites=true&w=majority&appName=decluster8n";

let client;
let db;

// Chain configurations
const CHAIN_CONFIG = {
  240: {
    name: "Cronos zkEVM Testnet",
    rpc: process.env.CRONOS_RPC_URL || "https://testnet.zkevm.cronos.org",
    symbol: "zkCRO",
    contracts: {
      treasury: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
      registry: "0xe821fAbc3d23790596669043b583e931d8fC2710",
      sessionKeyManager: "0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2"
    }
  },
  84532: {
    name: "Base Sepolia",
    rpc: process.env.BASE_RPC_URL || "https://sepolia.base.org",
    symbol: "ETH",
    contracts: {
      treasury: "0x0000000000000000000000000000000000000000",
      registry: "0x0000000000000000000000000000000000000000",
      sessionKeyManager: "0x0000000000000000000000000000000000000000"
    }
  },
  80002: {
    name: "Polygon Amoy",
    rpc: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
    symbol: "MATIC",
    contracts: {
      treasury: "0x0000000000000000000000000000000000000000",
      registry: "0x0000000000000000000000000000000000000000",
      sessionKeyManager: "0x0000000000000000000000000000000000000000"
    }
  },
  11155111: {
    name: "Ethereum Sepolia",
    rpc: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    symbol: "ETH",
    contracts: {
      treasury: "0x0000000000000000000000000000000000000000",
      registry: "0x0000000000000000000000000000000000000000",
      sessionKeyManager: "0x0000000000000000000000000000000000000000"
    }
  }
};

// Registry updates configuration
const ENABLE_REGISTRY_UPDATES = process.env.ENABLE_REGISTRY_UPDATES !== "false"; // Default: enabled

// Master wallet for executing payments
let masterWallet = null;
const walletProviders = {};

function initializeWallets() {
  const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("[NEXUS] No MASTER_WALLET_PRIVATE_KEY set - payment execution disabled");
    return;
  }

  for (const [chainId, config] of Object.entries(CHAIN_CONFIG)) {
    try {
      const provider = new ethers.JsonRpcProvider(config.rpc);
      walletProviders[chainId] = new ethers.Wallet(privateKey, provider);
      console.log(`[NEXUS] Initialized wallet for ${config.name}`);
    } catch (error) {
      console.error(`[NEXUS] Failed to init wallet for chain ${chainId}:`, error.message);
    }
  }
}

app.use(cors());
app.use(bodyParser.json());

// In-memory fallback database for when MongoDB is unavailable
let useInMemoryDB = false;
const inMemoryDB = {
  workflows: [],
  nexus_balances: [],
  nexus_deposits: [],
  nexus_transactions: []
};

// Mock collection that mimics MongoDB collection API
function createMockCollection(name) {
  return {
    find: (query) => ({
      toArray: async () => {
        return inMemoryDB[name].filter(item => {
          for (const key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        });
      },
      sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => inMemoryDB[name] }) }) })
    }),
    findOne: async (query) => {
      return inMemoryDB[name].find(item => {
        for (const key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    insertOne: async (doc) => {
      inMemoryDB[name].push({ ...doc, _id: Date.now().toString() });
      return { insertedId: doc._id };
    },
    updateOne: async (filter, update, options) => {
      let item = inMemoryDB[name].find(item => {
        for (const key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
      if (!item && options?.upsert) {
        item = { ...filter, _id: Date.now().toString() };
        inMemoryDB[name].push(item);
      }
      if (item && update.$set) {
        Object.assign(item, update.$set);
      }
      return { modifiedCount: item ? 1 : 0 };
    },
    countDocuments: async () => inMemoryDB[name].length,
    aggregate: () => ({ toArray: async () => [] })
  };
}

// Mock database that mimics MongoDB database API
const mockDB = {
  collection: (name) => createMockCollection(name)
};

async function connectDB() {
  // If already using in-memory, return mock
  if (useInMemoryDB) {
    return mockDB;
  }
  
  if (db) return db;
  
  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000
      });
    }
    if (!client.topology?.isConnected()) {
      await client.connect();
      console.log("[NEXUS] Connected to MongoDB");
    }
    db = client.db("d8n_main");
    return db;
  } catch (error) {
    console.warn("[NEXUS] ⚠️ MongoDB connection failed, using in-memory database");
    console.warn("[NEXUS] ⚠️ Data will NOT persist across restarts!");
    useInMemoryDB = true;
    return mockDB;
  }
}

// ================== ORIGINAL D8N ENDPOINTS ==================

// Save a Workflow
app.post("/api/workflows", async (req, res) => {
  const { user_wallet, workflow_name, workflow_data } = req.body;

  if (!user_wallet || !workflow_name || !workflow_data) {
    return res.status(400).json({ message: "Missing required workflow data." });
  }

  try {
    const database = await connectDB();
    const collection = database.collection("workflows");

    const filter = { walletAddress: user_wallet, workflowName: workflow_name };
    const updateDoc = {
      $set: {
        walletAddress: user_wallet,
        workflowName: workflow_name,
        workflowData: workflow_data,
        updatedAt: new Date(),
      },
    };
    const options = { upsert: true };

    const result = await collection.updateOne(filter, updateDoc, options);
    res.status(201).json({ message: "Workflow saved successfully!", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save workflow." });
  }
});

// Get all Workflows for a Wallet
app.get("/api/workflows/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ message: "Wallet address is required." });
  }

  try {
    const database = await connectDB();
    const collection = database.collection("workflows");
    const workflows = await collection.find({ walletAddress }).toArray();
    res.status(200).json(workflows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch workflows." });
  }
});

// ================== NEXUS BALANCE ENDPOINTS ==================

/**
 * GET /api/nexus/balance/:wallet
 * Get virtual balance for all chains
 */
app.get("/api/nexus/balance/:wallet", async (req, res) => {
  const { wallet } = req.params;

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    
    const userBalances = await balances.find({ 
      wallet: wallet.toLowerCase() 
    }).toArray();

    const result = {};
    for (const balance of userBalances) {
      result[balance.chainId] = {
        virtual: balance.virtualBalance,
        chainName: CHAIN_CONFIG[balance.chainId]?.name || "Unknown",
        symbol: CHAIN_CONFIG[balance.chainId]?.symbol || "TOKEN",
        lastUpdated: balance.updatedAt
      };
    }

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      balances: result 
    });
  } catch (err) {
    console.error("[NEXUS] Balance fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
});

/**
 * GET /api/nexus/balance/:wallet/:chainId
 * Get virtual balance for specific chain
 */
app.get("/api/nexus/balance/:wallet/:chainId", async (req, res) => {
  const { wallet, chainId } = req.params;

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    
    const balance = await balances.findOne({ 
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId)
    });

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId),
      virtualBalance: balance?.virtualBalance || "0",
      virtualBalanceFormatted: ethers.formatEther(balance?.virtualBalance || "0"),
      chainName: CHAIN_CONFIG[chainId]?.name || "Unknown"
    });
  } catch (err) {
    console.error("[NEXUS] Balance fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
});

/**
 * POST /api/nexus/deposit
 * Record a deposit (called when blockchain deposit is detected)
 */
app.post("/api/nexus/deposit", async (req, res) => {
  const { wallet, chainId, amount, txHash } = req.body;

  if (!wallet || !chainId || !amount || !txHash) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    const deposits = database.collection("nexus_deposits");
    const transactions = database.collection("nexus_transactions");

    // Check if deposit already processed
    const existingDeposit = await deposits.findOne({ txHash });
    if (existingDeposit) {
      return res.status(400).json({ success: false, message: "Deposit already processed" });
    }

    // Record deposit
    await deposits.insertOne({
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId),
      amount,
      txHash,
      processedAt: new Date()
    });

    // Update virtual balance
    const walletLower = wallet.toLowerCase();
    const chainIdNum = parseInt(chainId);
    
    // Get current balance
    const currentBalance = await balances.findOne({ 
      wallet: walletLower, 
      chainId: chainIdNum 
    });

    // Calculate new balance (handle BigInt as strings)
    const currentAmount = currentBalance?.virtualBalance || "0";
    const newAmount = (BigInt(currentAmount) + BigInt(amount)).toString();

    // Update or create balance record
    await balances.updateOne(
      { wallet: walletLower, chainId: chainIdNum },
      { 
        $set: { 
          virtualBalance: newAmount,
          updatedAt: new Date(),
          createdAt: currentBalance?.createdAt || new Date()
        }
      },
      { upsert: true }
    );

    // Record transaction
    await transactions.insertOne({
      wallet: walletLower,
      type: "deposit",
      chainId: chainIdNum,
      amount,
      txHash,
      timestamp: new Date(),
      status: "completed"
    });

    console.log(`[NEXUS] ✅ Deposit recorded: ${ethers.formatEther(amount)} CRO on chain ${chainIdNum} from ${walletLower}`);
    console.log(`[NEXUS] 💰 New virtual balance: ${ethers.formatEther(newAmount)} CRO`);

    res.json({ 
      success: true, 
      message: "Deposit recorded successfully",
      txHash,
      virtualBalance: newAmount
    });
  } catch (err) {
    console.error("[NEXUS] ❌ Deposit error:", err);
    res.status(500).json({ success: false, message: "Failed to process deposit" });
  }
});

/**
 * POST /api/nexus/pay
 * Execute payment to a provider
 */
app.post("/api/nexus/pay", async (req, res) => {
  const { wallet, provider, amount, chainId } = req.body;

  if (!wallet || !provider || !amount || !chainId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const chainIdNum = parseInt(chainId);

  // Normalize addresses to lowercase to avoid checksum issues
  const walletLower = wallet.toLowerCase();
  const providerLower = provider.toLowerCase();

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    const transactions = database.collection("nexus_transactions");

    // Check virtual balance
    const balance = await balances.findOne({ 
      wallet: walletLower, 
      chainId: chainIdNum 
    });

    const virtualBalance = BigInt(balance?.virtualBalance || "0");
    const paymentAmount = BigInt(amount);

    if (virtualBalance < paymentAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Insufficient virtual balance",
        required: amount,
        available: balance?.virtualBalance || "0"
      });
    }

    // Get master wallet for this chain
    const masterWalletForChain = walletProviders[chainIdNum];
    
    // Check if we should skip real blockchain transactions (virtual mode)
    const VIRTUAL_MODE = process.env.VIRTUAL_MODE === 'true' || !masterWalletForChain;
    
    let txHash;
    let registryTxHash = null;
    let status = "completed";

    if (masterWalletForChain && !VIRTUAL_MODE) {
      try {
        // Execute real on-chain payment
        console.log(`[NEXUS] Sending ${ethers.formatEther(amount)} to ${providerLower} on chain ${chainIdNum}`);
        
        // Get current gas price and add buffer for zkEVM
        const feeData = await masterWalletForChain.provider.getFeeData();
        const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : undefined; // 20% buffer
        
        const tx = await masterWalletForChain.sendTransaction({
          to: providerLower,
          value: paymentAmount,
          gasLimit: 300000, // Higher limit for zkEVM validation (no BigInt)
          gasPrice: gasPrice, // Explicit gas price
          type: 0 // Legacy transaction for better compatibility
        });

        console.log(`[NEXUS] Transaction sent: ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        console.log(`[NEXUS] Payment successful: ${txHash}`);

        // Record payment on NexusRegistry contract (PROMPT 8)
        if (ENABLE_REGISTRY_UPDATES && CHAIN_CONFIG[chainIdNum]?.contracts?.registry) {
          try {
            const registryAddress = CHAIN_CONFIG[chainIdNum].contracts.registry;
            
            // Skip if registry not deployed (address is zero)
            if (registryAddress !== "0x0000000000000000000000000000000000000000") {
              console.log(`[NEXUS] Recording payment on Registry contract: ${registryAddress}`);
              
              const registryContract = new ethers.Contract(
                registryAddress,
                nexusRegistryAbi,
                masterWalletForChain
              );

              // Call recordPayment(provider, payer, amount)
              const registryTx = await registryContract.recordPayment(
                providerLower,
                walletLower,
                paymentAmount
              );

              const registryReceipt = await registryTx.wait();
              registryTxHash = registryReceipt.hash;

              console.log(`[NEXUS] Registry updated: ${registryTxHash}`);
            } else {
              console.log(`[NEXUS] Registry not deployed on chain ${chainIdNum}, skipping reputation update`);
            }
          } catch (registryError) {
            // Don't fail the payment if registry update fails
            console.error("[NEXUS] Registry update failed (non-critical):", registryError.message);
            registryTxHash = null;
          }
        }

      } catch (txError) {
        console.error("[NEXUS] Payment transaction failed:", txError.message);
        // Don't return error - still record the payment attempt in database
        txHash = "0xfailed_" + Date.now();
        status = "failed";
        console.log(`[NEXUS] Recording failed payment attempt for tracking purposes`);
      }
    } else {
      // Virtual mode or demo mode - simulate transaction
      txHash = "0xvirtual_" + Date.now();
      status = "completed";
      console.log(`[NEXUS] Virtual mode - payment tracked without blockchain tx: ${txHash}`);
    }

    // Deduct from virtual balance
    const newBalance = (virtualBalance - paymentAmount).toString();
    await balances.updateOne(
      { wallet: walletLower, chainId: chainIdNum },
      { $set: { virtualBalance: newBalance, updatedAt: new Date() } }
    );

    // Record transaction with registryTxHash
    await transactions.insertOne({
      wallet: walletLower,
      type: "payment",
      chainId: chainIdNum,
      amount,
      provider: providerLower,
      txHash,
      registryTxHash, // New field for registry update tx
      timestamp: new Date(),
      status
    });

    res.json({ 
      success: true, 
      txHash,
      registryTxHash, // Include in response
      amountPaid: amount,
      amountFormatted: ethers.formatEther(amount),
      newBalance,
      newBalanceFormatted: ethers.formatEther(newBalance)
    });
  } catch (err) {
    console.error("[NEXUS] Payment error:", err);
    res.status(500).json({ success: false, message: "Failed to execute payment" });
  }
});

/**
 * GET /api/nexus/transactions/:wallet
 * Get transaction history with advanced filtering
 * PROMPT 14: Enhanced endpoint for Transaction Monitoring Dashboard
 */
app.get("/api/nexus/transactions/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const {
    limit = 50,
    offset = 0,
    chainId,
    type, // deposit, payment, execution
    status, // pending, completed, failed
    fromDate,
    toDate,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = req.query;

  try {
    const database = await connectDB();
    const transactions = database.collection("nexus_transactions");
    
    // Build query with filters
    const query = { wallet: wallet.toLowerCase() };
    
    if (chainId) {
      query.chainId = parseInt(chainId);
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) {
        query.timestamp.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.timestamp.$lte = new Date(toDate);
      }
    }

    // Get total count for pagination
    const totalCount = await transactions.countDocuments(query);

    // Get transactions with sorting and pagination
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const txs = await transactions
      .find(query)
      .sort(sortOption)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    // Format transactions
    const formatted = txs.map(tx => ({
      ...tx,
      amountFormatted: ethers.formatEther(tx.amount),
      chainName: CHAIN_CONFIG[tx.chainId]?.name || "Unknown",
      symbol: CHAIN_CONFIG[tx.chainId]?.symbol || "TOKEN",
      explorerUrl: `${CHAIN_CONFIG[tx.chainId]?.explorer || ''}/tx/${tx.txHash}`
    }));

    // Calculate summary statistics - collect amounts as strings then sum in JS
    const allTxs = await transactions.find({ wallet: wallet.toLowerCase() }).toArray();
    
    let totalDeposited = BigInt(0);
    let totalPaid = BigInt(0);
    let depositCount = 0;
    let paymentCount = 0;
    
    for (const tx of allTxs) {
      try {
        const amount = BigInt(tx.amount || '0');
        if (tx.type === 'deposit') {
          totalDeposited += amount;
          depositCount++;
        } else if (tx.type === 'payment') {
          totalPaid += amount;
          paymentCount++;
        }
      } catch (e) {
        console.error('Error processing transaction amount:', e);
      }
    }

    const summary = {
      totalDeposited: totalDeposited.toString(),
      totalDepositedFormatted: ethers.formatEther(totalDeposited),
      totalPaid: totalPaid.toString(),
      totalPaidFormatted: ethers.formatEther(totalPaid),
      totalTransactions: allTxs.length,
      depositsCount: depositCount,
      paymentsCount: paymentCount
    };

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      pagination: {
        total: totalCount,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      },
      summary,
      transactions: formatted 
    });
  } catch (err) {
    console.error("[NEXUS] Transactions fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

/**
 * GET /api/nexus/supported-chains
 * Get list of supported chains
 */
app.get("/api/nexus/supported-chains", (req, res) => {
  const chains = Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    chainId: parseInt(id),
    ...config
  }));
  res.json({ success: true, chains });
});

/**
 * GET /api/nexus/providers/stats
 * Get provider statistics for reputation dashboard (PROMPT 16)
 */
app.get("/api/nexus/providers/stats", async (req, res) => {
  try {
    const database = await connectDB();
    const transactions = database.collection("nexus_transactions");

    // Aggregate provider statistics from payment transactions
    const providerStats = await transactions.aggregate([
      { $match: { type: "payment", provider: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            provider: "$provider",
            chainId: "$chainId"
          },
          totalEarnings: { $sum: 1 },
          totalEarningsStr: { $push: "$amount" },
          successfulCalls: { $sum: 1 },
          lastPayment: { $max: "$timestamp" },
          payers: { $addToSet: "$wallet" }
        }
      },
      {
        $project: {
          provider: "$_id.provider",
          chainId: "$_id.chainId",
          totalEarnings: 1,
          totalEarningsStr: 1,
          successfulCalls: 1,
          lastPayment: 1,
          uniquePayers: { $size: "$payers" },
          _id: 0
        }
      },
      { $sort: { successfulCalls: -1 } }
    ]).toArray();

    // Format with chain info
    const formatted = providerStats.map((stat, index) => {
      // Sum up all earnings (they're stored as strings)
      let totalEarnings = BigInt(0);
      try {
        for (const amount of stat.totalEarningsStr || []) {
          totalEarnings += BigInt(amount);
        }
      } catch (e) {
        console.error("Error summing earnings:", e);
      }

      return {
        provider: stat.provider,
        chainId: stat.chainId,
        rank: index + 1,
        totalEarnings: totalEarnings.toString(),
        totalEarningsFormatted: ethers.formatEther(totalEarnings),
        successfulCalls: stat.successfulCalls,
        uniquePayers: stat.uniquePayers,
        lastPayment: stat.lastPayment,
        chainName: CHAIN_CONFIG[stat.chainId]?.name || "Unknown",
        chainSymbol: CHAIN_CONFIG[stat.chainId]?.symbol || "TOKEN"
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      providers: formatted
    });
  } catch (err) {
    console.error("[NEXUS] Provider stats fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch provider statistics" });
  }
});

/**
 * POST /api/nexus/estimate-cost
 * Estimate workflow execution cost (PROMPT 15)
 */
app.post("/api/nexus/estimate-cost", async (req, res) => {
  const { workflow, chainId } = req.body;

  if (!workflow || !chainId) {
    return res.status(400).json({ success: false, message: "Workflow and chainId required" });
  }

  try {
    const chain = CHAIN_CONFIG[chainId];
    if (!chain) {
      return res.status(400).json({ success: false, message: "Unsupported chain" });
    }

    // Initialize costs
    let totalDataCost = BigInt(0);
    let estimatedGasCost = BigInt(0);
    const breakdown = [];

    // Parse workflow nodes
    const nodes = workflow.nodes || {};
    
    for (const [nodeId, node] of Object.entries(nodes)) {
      const nodeType = node.type || node.node_data?.type;
      let nodeCost = {
        nodeId,
        nodeType,
        label: node.label || nodeId,
        dataCost: "0",
        gasCost: "0",
        description: ""
      };

      switch (nodeType) {
        case "nexusPay":
          // Estimate API payment cost (default: 0.001 CRO)
          const apiCost = ethers.parseEther("0.001");
          nodeCost.dataCost = apiCost.toString();
          nodeCost.description = "HTTP 402 API payment";
          totalDataCost += apiCost;
          break;

        case "swap":
          // Estimate DEX swap gas (typical: 150,000 gas)
          const swapGas = 150000n;
          const gasPrice = ethers.parseUnits("1", "gwei"); // Estimate
          const swapGasCost = swapGas * gasPrice;
          nodeCost.gasCost = swapGasCost.toString();
          nodeCost.description = "DEX swap transaction";
          estimatedGasCost += swapGasCost;
          break;

        case "sendToken":
          // Estimate ERC20 transfer gas (typical: 65,000 gas)
          const transferGas = 65000n;
          const transferGasPrice = ethers.parseUnits("1", "gwei");
          const transferGasCost = transferGas * transferGasPrice;
          nodeCost.gasCost = transferGasCost.toString();
          nodeCost.description = "Token transfer";
          estimatedGasCost += transferGasCost;
          break;

        case "condition":
        case "print":
        case "delay":
          // No cost for logic-only nodes
          nodeCost.description = "Logic only (no cost)";
          break;

        default:
          nodeCost.description = "Unknown node type";
      }

      breakdown.push(nodeCost);
    }

    const totalCost = totalDataCost + estimatedGasCost;

    res.json({
      success: true,
      chainId,
      chainName: chain.name,
      estimate: {
        totalCost: totalCost.toString(),
        totalCostFormatted: ethers.formatEther(totalCost),
        dataCost: totalDataCost.toString(),
        dataCostFormatted: ethers.formatEther(totalDataCost),
        gasCost: estimatedGasCost.toString(),
        gasCostFormatted: ethers.formatEther(estimatedGasCost),
        transactionCount: breakdown.filter(b => b.gasCost !== "0").length,
        apiCallCount: breakdown.filter(b => b.dataCost !== "0").length
      },
      breakdown
    });
  } catch (err) {
    console.error("[NEXUS] Cost estimation error:", err);
    res.status(500).json({ success: false, message: "Failed to estimate cost" });
  }
});

// ================== AI WORKFLOW GENERATION ==================

/**
 * POST /api/ai/generate-workflow
 * Generate a workflow from natural language using AI
 */
app.post("/api/ai/generate-workflow", async (req, res) => {
  const { prompt, userWallet } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt is required" });
  }

  console.log(`[AI] Generating workflow for: "${prompt.substring(0, 50)}..."`);

  try {
    const result = await generateWorkflowFromPrompt(prompt);
    
    // Optionally log the generation
    if (userWallet) {
      const database = await connectDB();
      await database.collection("ai_generations").insertOne({
        wallet: userWallet.toLowerCase(),
        prompt,
        success: result.success,
        mode: result.mode,
        nodeCount: result.workflow?.nodes?.length || 0,
        timestamp: new Date(),
      });
    }

    res.json(result);
  } catch (err) {
    console.error("[AI] Generation error:", err);
    res.status(500).json({ success: false, message: "Failed to generate workflow" });
  }
});

// ================== SOCIAL TRADING / MARKETPLACE (Feature 4) ==================


/**
 * GET /api/marketplace/workflows
 * Get public workflows available for copy-trading
 */
app.get("/api/marketplace/workflows", async (req, res) => {
  const { category, sortBy = "performance", limit = 20 } = req.query;

  try {
    const database = await connectDB();
    const workflows = database.collection("marketplace_workflows");

    const query = { isPublic: true };
    if (category) query.category = category;

    const sortOptions = {
      performance: { "stats.totalReturn": -1 },
      popular: { "stats.copiers": -1 },
      newest: { createdAt: -1 },
    };

    const results = await workflows
      .find(query)
      .sort(sortOptions[sortBy] || sortOptions.performance)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      count: results.length,
      workflows: results,
    });
  } catch (err) {
    console.error("[MARKETPLACE] Error fetching workflows:", err);
    res.status(500).json({ success: false, message: "Failed to fetch workflows" });
  }
});

/**
 * POST /api/marketplace/publish
 * Publish a workflow to the marketplace
 */
app.post("/api/marketplace/publish", async (req, res) => {
  const { wallet, workflowId, name, description, category, creatorFee = 5 } = req.body;

  if (!wallet || !workflowId || !name) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const database = await connectDB();
    const workflows = database.collection("marketplace_workflows");
    const userWorkflows = database.collection("workflows");

    // Get the original workflow
    const original = await userWorkflows.findOne({ 
      walletAddress: wallet, 
      _id: workflowId 
    });

    const publishedWorkflow = {
      originalId: workflowId,
      creator: wallet.toLowerCase(),
      name,
      description,
      category: category || "general",
      creatorFee, // % fee for creator on profits
      workflowData: original?.workflowData || {},
      isPublic: true,
      createdAt: new Date(),
      stats: {
        copiers: 0,
        totalReturn: 0,
        avgReturn: 0,
        successRate: 0,
      },
    };

    const result = await workflows.insertOne(publishedWorkflow);

    res.json({
      success: true,
      message: "Workflow published to marketplace",
      workflowId: result.insertedId,
    });
  } catch (err) {
    console.error("[MARKETPLACE] Error publishing workflow:", err);
    res.status(500).json({ success: false, message: "Failed to publish workflow" });
  }
});

/**
 * GET /api/marketplace/leaderboard
 * Get top performing workflows/creators
 */
app.get("/api/marketplace/leaderboard", async (req, res) => {
  const { type = "workflows", limit = 10 } = req.query;

  try {
    const database = await connectDB();

    if (type === "workflows") {
      const workflows = await database.collection("marketplace_workflows")
        .find({ isPublic: true })
        .sort({ "stats.totalReturn": -1 })
        .limit(parseInt(limit))
        .toArray();

      res.json({
        success: true,
        type: "workflows",
        leaderboard: workflows.map((w, i) => ({
          rank: i + 1,
          id: w._id,
          name: w.name,
          creator: w.creator,
          totalReturn: w.stats.totalReturn,
          copiers: w.stats.copiers,
        })),
      });
    } else {
      // Creator leaderboard
      const creators = await database.collection("marketplace_workflows").aggregate([
        { $match: { isPublic: true } },
        { $group: { 
          _id: "$creator", 
          totalReturn: { $sum: "$stats.totalReturn" },
          workflowCount: { $sum: 1 },
          totalCopiers: { $sum: "$stats.copiers" }
        }},
        { $sort: { totalReturn: -1 } },
        { $limit: parseInt(limit) }
      ]).toArray();

      res.json({
        success: true,
        type: "creators",
        leaderboard: creators.map((c, i) => ({
          rank: i + 1,
          creator: c._id,
          totalReturn: c.totalReturn,
          workflowCount: c.workflowCount,
          totalCopiers: c.totalCopiers,
        })),
      });
    }
  } catch (err) {
    console.error("[MARKETPLACE] Error fetching leaderboard:", err);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

/**
 * POST /api/marketplace/copy
 * Copy a workflow for personal use
 */
app.post("/api/marketplace/copy", async (req, res) => {
  const { wallet, marketplaceWorkflowId, allocation } = req.body;

  if (!wallet || !marketplaceWorkflowId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const database = await connectDB();
    const marketplaceWorkflows = database.collection("marketplace_workflows");
    const userWorkflows = database.collection("workflows");

    // Get marketplace workflow
    const sourceWorkflow = await marketplaceWorkflows.findOne({ 
      _id: marketplaceWorkflowId 
    });

    if (!sourceWorkflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    // Create copy for user
    const copiedWorkflow = {
      walletAddress: wallet.toLowerCase(),
      workflowName: `Copy of ${sourceWorkflow.name}`,
      workflowData: sourceWorkflow.workflowData,
      sourceWorkflowId: marketplaceWorkflowId,
      creatorAddress: sourceWorkflow.creator,
      creatorFee: sourceWorkflow.creatorFee,
      allocation: allocation || "0",
      createdAt: new Date(),
      isCopy: true,
    };

    const result = await userWorkflows.insertOne(copiedWorkflow);

    // Update copier count
    await marketplaceWorkflows.updateOne(
      { _id: marketplaceWorkflowId },
      { $inc: { "stats.copiers": 1 } }
    );

    res.json({
      success: true,
      message: "Workflow copied successfully",
      workflowId: result.insertedId,
    });
  } catch (err) {
    console.error("[MARKETPLACE] Error copying workflow:", err);
    res.status(500).json({ success: false, message: "Failed to copy workflow" });
  }
});

// ============================================
// LEADERBOARD & TOP PERFORMERS ENDPOINTS
// ============================================

/**
 * GET /api/leaderboard/traders
 * Get top performing traders
 */
app.get("/api/leaderboard/traders", async (req, res) => {
  const { timeframe = "30d", limit = 10 } = req.query;

  // Mock leaderboard data - in production, calculate from actual workflow executions
  const traders = [
    { rank: 1, address: "0x7a25...3f91", username: "DeFiWhale", totalProfit: 145230, winRate: 94.2, copiers: 1234, workflows: 8 },
    { rank: 2, address: "0x3b92...8c4d", username: "AlphaHunter", totalProfit: 98450, winRate: 89.5, copiers: 876, workflows: 12 },
    { rank: 3, address: "0x5f18...2a6e", username: "YieldFarmer", totalProfit: 76890, winRate: 87.3, copiers: 654, workflows: 6 },
    { rank: 4, address: "0x9c44...1b7f", username: "CryptoSage", totalProfit: 54320, winRate: 82.1, copiers: 432, workflows: 15 },
    { rank: 5, address: "0x2e67...9d3c", username: "AaveMaster", totalProfit: 43210, winRate: 79.8, copiers: 321, workflows: 9 },
  ];

  res.json({
    success: true,
    timeframe,
    traders: traders.slice(0, parseInt(limit)),
    stats: { totalVolume: 12400000, activeTraders: 2341, totalWorkflows: 847 },
  });
});

/**
 * GET /api/leaderboard/workflows
 * Get top performing workflows
 */
app.get("/api/leaderboard/workflows", async (req, res) => {
  const { category, limit = 10 } = req.query;

  const workflows = [
    { id: 1, name: "ETH DCA + Auto-Compound", creator: "DeFiWhale", roi: 47.2, copiers: 456, category: "defi" },
    { id: 2, name: "Health Factor Guardian", creator: "AaveMaster", roi: 32.8, copiers: 234, category: "risk" },
    { id: 3, name: "Cross-Chain Arbitrage", creator: "AlphaHunter", roi: 28.5, copiers: 189, category: "crosschain" },
    { id: 4, name: "AI Sentiment Trader", creator: "CryptoSage", roi: 24.1, copiers: 156, category: "ai" },
    { id: 5, name: "Stablecoin Yield Optimizer", creator: "YieldFarmer", roi: 18.3, copiers: 123, category: "defi" },
  ];

  const filtered = category ? workflows.filter(w => w.category === category) : workflows;

  res.json({
    success: true,
    workflows: filtered.slice(0, parseInt(limit)),
  });
});

// ============================================
// AAVE HEALTH FACTOR ENDPOINTS
// ============================================

/**
 * GET /api/defi/health-factor/:address
 * Get Aave health factor for an address (mock for demo)
 */
app.get("/api/defi/health-factor/:address", async (req, res) => {
  const { address } = req.params;
  const { chainId = 1 } = req.query;

  // Mock data - in production, query Aave on-chain
  const seed = parseInt(address.slice(2, 6), 16) % 4;
  const healthFactors = [1.85, 2.45, 1.12, 1.65];
  const healthFactor = healthFactors[seed];

  const getRiskLevel = (hf) => {
    if (hf >= 2) return { level: "safe", color: "green", label: "Safe" };
    if (hf >= 1.5) return { level: "moderate", color: "yellow", label: "Moderate" };
    if (hf >= 1.1) return { level: "warning", color: "orange", label: "Warning" };
    return { level: "danger", color: "red", label: "Danger" };
  };

  res.json({
    success: true,
    address,
    chainId: parseInt(chainId),
    healthFactor,
    totalCollateral: 15000 + seed * 5000,
    totalDebt: 6000 + seed * 2000,
    availableBorrows: 3000 + seed * 1000,
    liquidationThreshold: 82.5,
    ltv: 75,
    riskLevel: getRiskLevel(healthFactor),
    isHealthy: healthFactor > 1.1,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/defi/auto-repay
 * Execute auto-repay based on health factor (mock)
 */
app.post("/api/defi/auto-repay", async (req, res) => {
  const { address, targetHealthFactor = 1.5, repayPercentage = 50 } = req.body;

  // Simulate repay calculation
  res.json({
    success: true,
    message: "Auto-repay executed (simulated)",
    address,
    targetHealthFactor,
    repayPercentage,
    estimatedRepayAmount: "500.00",
    newHealthFactor: targetHealthFactor,
    txHash: "0x" + Date.now().toString(16) + "abc123",
  });
});

// ============================================
// REGISTRY PROVIDER ENDPOINTS (PROMPT 9)
// ============================================

/**
 * POST /api/registry/register-service
 * Register a new data provider service
 */
app.post("/api/registry/register-service", async (req, res) => {
  const { providerWallet, endpoint, priceInWei, category, chainId = 240 } = req.body;

  // Validation
  if (!providerWallet || !endpoint || !priceInWei || !category) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: providerWallet, endpoint, priceInWei, category" 
    });
  }

  // Validate wallet address
  if (!ethers.isAddress(providerWallet)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid provider wallet address" 
    });
  }

  // Validate endpoint URL
  try {
    new URL(endpoint);
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid endpoint URL" 
    });
  }

  // Validate category
  if (category.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Category cannot be empty" 
    });
  }

  const chainIdNum = parseInt(chainId);
  
  try {
    const registryAddress = CHAIN_CONFIG[chainIdNum]?.contracts?.registry;

    if (!registryAddress || registryAddress === "0x0000000000000000000000000000000000000000") {
      return res.status(400).json({ 
        success: false, 
        message: `Registry not deployed on chain ${chainIdNum}` 
      });
    }

    // Get provider and registry contract
    const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG[chainIdNum].rpc);
    const registryContract = new ethers.Contract(
      registryAddress,
      nexusRegistryAbi,
      provider
    );

    // Check minimum price
    const minPrice = await registryContract.MIN_PRICE();
    const priceInWeiBigInt = BigInt(priceInWei);

    if (priceInWeiBigInt < minPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Price too low. Minimum: ${ethers.formatEther(minPrice)} ${CHAIN_CONFIG[chainIdNum].symbol}`,
        minimumPrice: minPrice.toString()
      });
    }

    // Store in MongoDB for caching
    const database = await connectDB();
    const registeredProviders = database.collection("registered_providers");

    const providerData = {
      providerWallet: providerWallet.toLowerCase(),
      endpoint,
      priceInWei: priceInWei.toString(),
      category,
      chainId: chainIdNum,
      registeredAt: new Date(),
      status: "pending", // Will be "active" after on-chain registration
      active: true
    };

    await registeredProviders.updateOne(
      { 
        providerWallet: providerWallet.toLowerCase(), 
        chainId: chainIdNum 
      },
      { $set: providerData },
      { upsert: true }
    );

    // Return transaction data for frontend to execute
    // Provider needs to sign the transaction themselves
    const txData = {
      to: registryAddress,
      data: registryContract.interface.encodeFunctionData("registerService", [
        endpoint,
        priceInWeiBigInt,
        category
      ]),
      value: "0"
    };

    res.json({
      success: true,
      message: "Provider registration data prepared. Please sign and submit the transaction.",
      providerWallet,
      chainId: chainIdNum,
      registryAddress,
      txData,
      gasEstimate: "100000", // Approximate
      instructions: "Use the txData to submit a transaction from your provider wallet"
    });

  } catch (err) {
    console.error("[REGISTRY] Registration error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to prepare registration: " + err.message 
    });
  }
});

/**
 * GET /api/registry/providers
 * Get all active providers
 */
app.get("/api/registry/providers", async (req, res) => {
  const { chainId = 240, category } = req.query;
  const chainIdNum = parseInt(chainId);

  try {
    const registryAddress = CHAIN_CONFIG[chainIdNum]?.contracts?.registry;

    if (!registryAddress || registryAddress === "0x0000000000000000000000000000000000000000") {
      // Fallback to MongoDB cache
      const database = await connectDB();
      const registeredProviders = database.collection("registered_providers");
      
      const query = { chainId: chainIdNum, active: true };
      if (category) query.category = category;

      const providers = await registeredProviders.find(query).toArray();

      return res.json({
        success: true,
        source: "cache",
        chainId: chainIdNum,
        providers: providers.map(p => ({
          address: p.providerWallet,
          endpoint: p.endpoint,
          price: p.priceInWei,
          category: p.category,
          registeredAt: p.registeredAt
        }))
      });
    }

    // Query on-chain registry
    const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG[chainIdNum].rpc);
    const registryContract = new ethers.Contract(
      registryAddress,
      nexusRegistryAbi,
      provider
    );

    let providerAddresses;
    let prices;
    let reputations;

    if (category) {
      // Get providers by category
      [providerAddresses, prices, reputations] = await registryContract.getServicesByCategory(category);
    } else {
      // Get all active providers
      providerAddresses = await registryContract.getActiveProviders();
      
      // Fetch details for each
      prices = [];
      reputations = [];
      
      for (const addr of providerAddresses) {
        const [endpoint, price, cat, rep, calls, active] = await registryContract.getServiceDetails(addr);
        prices.push(price);
        reputations.push(rep);
      }
    }

    // Fetch full details for all providers
    const providersWithDetails = [];

    for (let i = 0; i < providerAddresses.length; i++) {
      const addr = providerAddresses[i];
      const [endpoint, price, cat, reputation, totalCalls, active] = 
        await registryContract.getServiceDetails(addr);

      providersWithDetails.push({
        address: addr,
        endpoint,
        price: price.toString(),
        priceFormatted: ethers.formatEther(price),
        category: cat,
        reputation: reputation.toString(),
        totalCalls: totalCalls.toString(),
        active
      });
    }

    // Cache in MongoDB
    const database = await connectDB();
    const cacheCollection = database.collection("provider_cache");
    
    await cacheCollection.updateOne(
      { chainId: chainIdNum, category: category || "all" },
      { 
        $set: { 
          providers: providersWithDetails,
          lastUpdated: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        } 
      },
      { upsert: true }
    );

    res.json({
      success: true,
      source: "blockchain",
      chainId: chainIdNum,
      category: category || "all",
      count: providersWithDetails.length,
      providers: providersWithDetails
    });

  } catch (err) {
    console.error("[REGISTRY] Error fetching providers:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch providers: " + err.message 
    });
  }
});

/**
 * GET /api/registry/providers/:category
 * Get providers filtered by category
 */
app.get("/api/registry/providers/:category", async (req, res) => {
  const { category } = req.params;
  const { chainId = 240 } = req.query;

  // Redirect to main endpoint with category filter
  req.query.category = category;
  return app._router.handle(
    { ...req, url: `/api/registry/providers?chainId=${chainId}&category=${category}` },
    res
  );
});

/**
 * GET /api/registry/provider/:address
 * Get details for a specific provider
 */
app.get("/api/registry/provider/:address", async (req, res) => {
  const { address } = req.params;
  const { chainId = 240 } = req.query;
  const chainIdNum = parseInt(chainId);

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid provider address" 
    });
  }

  try {
    const registryAddress = CHAIN_CONFIG[chainIdNum]?.contracts?.registry;

    if (!registryAddress || registryAddress === "0x0000000000000000000000000000000000000000") {
      return res.status(400).json({ 
        success: false, 
        message: `Registry not deployed on chain ${chainIdNum}` 
      });
    }

    const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG[chainIdNum].rpc);
    const registryContract = new ethers.Contract(
      registryAddress,
      nexusRegistryAbi,
      provider
    );

    const [endpoint, price, category, reputation, totalCalls, active] = 
      await registryContract.getServiceDetails(address);

    if (!active && endpoint === "") {
      return res.status(404).json({ 
        success: false, 
        message: "Provider not found or inactive" 
      });
    }

    res.json({
      success: true,
      provider: {
        address,
        endpoint,
        price: price.toString(),
        priceFormatted: ethers.formatEther(price),
        category,
        reputation: reputation.toString(),
        totalCalls: totalCalls.toString(),
        active,
        chainId: chainIdNum
      }
    });

  } catch (err) {
    console.error("[REGISTRY] Error fetching provider details:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch provider details: " + err.message 
    });
  }
});

/**
 * GET /api/registry/status
 * Get listener and registry status
 */
app.get("/api/registry/status", async (req, res) => {
  const listenerStatus = getListenerStatus();
  
  res.json({
    success: true,
    depositListener: listenerStatus,
    registryUpdates: ENABLE_REGISTRY_UPDATES,
    supportedChains: Object.keys(CHAIN_CONFIG).map(id => ({
      chainId: parseInt(id),
      name: CHAIN_CONFIG[id].name,
      registryDeployed: CHAIN_CONFIG[id].contracts?.registry !== "0x0000000000000000000000000000000000000000"
    }))
  });
});

// ============================================
// AI TRADING ENDPOINTS
// ============================================

/**
 * POST /api/trading/positions
 * Store/update trading position
 */
app.post("/api/trading/positions", async (req, res) => {
  const { wallet, position } = req.body;

  if (!wallet || !position) {
    return res.status(400).json({ success: false, message: "Missing wallet or position data" });
  }

  try {
    const database = await connectDB();
    const positions = database.collection("trading_positions");

    const positionData = {
      wallet: wallet.toLowerCase(),
      symbol: position.symbol,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice || position.entryPrice,
      stopLoss: position.stopLoss,
      takeProfit: position.takeProfit,
      positionSize: position.positionSize,
      positionType: position.positionType || "long",
      status: position.status || "open",
      pnlPercent: position.pnlPercent || 0,
      openedAt: position.openedAt || new Date(),
      updatedAt: new Date(),
      txHash: position.txHash,
    };

    await positions.updateOne(
      { wallet: wallet.toLowerCase(), symbol: position.symbol, status: "open" },
      { $set: positionData },
      { upsert: true }
    );

    res.json({ success: true, message: "Position saved", position: positionData });
  } catch (err) {
    console.error("[TRADING] Position save error:", err);
    res.status(500).json({ success: false, message: "Failed to save position" });
  }
});

/**
 * GET /api/trading/positions/:wallet
 * Get all positions for a wallet
 */
app.get("/api/trading/positions/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const { status = "all" } = req.query;

  try {
    const database = await connectDB();
    const positions = database.collection("trading_positions");

    const query = { wallet: wallet.toLowerCase() };
    if (status !== "all") {
      query.status = status;
    }

    const userPositions = await positions.find(query).sort({ openedAt: -1 }).toArray();

    // Calculate totals
    let totalPnL = 0;
    let openPositions = 0;
    
    userPositions.forEach(p => {
      if (p.status === "open") openPositions++;
      totalPnL += p.pnlPercent || 0;
    });

    res.json({
      success: true,
      wallet: wallet.toLowerCase(),
      positions: userPositions,
      summary: {
        totalPositions: userPositions.length,
        openPositions,
        totalPnL: totalPnL.toFixed(2),
      },
    });
  } catch (err) {
    console.error("[TRADING] Positions fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch positions" });
  }
});

/**
 * POST /api/trading/close-position
 * Close a trading position
 */
app.post("/api/trading/close-position", async (req, res) => {
  const { wallet, symbol, exitPrice, reason } = req.body;

  if (!wallet || !symbol || !exitPrice) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const database = await connectDB();
    const positions = database.collection("trading_positions");
    const tradeHistory = database.collection("trade_history");

    // Find open position
    const position = await positions.findOne({
      wallet: wallet.toLowerCase(),
      symbol,
      status: "open",
    });

    if (!position) {
      return res.status(404).json({ success: false, message: "No open position found" });
    }

    // Calculate P&L
    const pnlPercent = position.positionType === "long"
      ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - exitPrice) / position.entryPrice) * 100;

    const pnlAmount = parseFloat(position.positionSize) * (pnlPercent / 100);

    // Update position to closed
    await positions.updateOne(
      { _id: position._id },
      {
        $set: {
          status: "closed",
          exitPrice,
          pnlPercent,
          pnlAmount,
          closedAt: new Date(),
          closeReason: reason || "manual",
        },
      }
    );

    // Record in trade history
    await tradeHistory.insertOne({
      wallet: wallet.toLowerCase(),
      symbol,
      positionType: position.positionType,
      entryPrice: position.entryPrice,
      exitPrice,
      positionSize: position.positionSize,
      pnlPercent,
      pnlAmount,
      openedAt: position.openedAt,
      closedAt: new Date(),
      closeReason: reason || "manual",
      duration: Date.now() - new Date(position.openedAt).getTime(),
    });

    res.json({
      success: true,
      message: "Position closed",
      result: {
        symbol,
        entryPrice: position.entryPrice,
        exitPrice,
        pnlPercent: pnlPercent.toFixed(2),
        pnlAmount: pnlAmount.toFixed(4),
        reason: reason || "manual",
      },
    });
  } catch (err) {
    console.error("[TRADING] Close position error:", err);
    res.status(500).json({ success: false, message: "Failed to close position" });
  }
});

/**
 * GET /api/trading/history/:wallet
 * Get trade history for a wallet
 */
app.get("/api/trading/history/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const database = await connectDB();
    const tradeHistory = database.collection("trade_history");

    const trades = await tradeHistory
      .find({ wallet: wallet.toLowerCase() })
      .sort({ closedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    // Calculate stats
    let totalTrades = trades.length;
    let winningTrades = trades.filter(t => t.pnlPercent > 0).length;
    let totalPnL = trades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);

    res.json({
      success: true,
      wallet: wallet.toLowerCase(),
      trades,
      stats: {
        totalTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0,
        totalPnL: totalPnL.toFixed(2),
        avgPnL: totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : 0,
      },
    });
  } catch (err) {
    console.error("[TRADING] History fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch trade history" });
  }
});

/**
 * GET /api/trading/risk-settings/:wallet
 * Get risk management settings for a wallet
 */
app.get("/api/trading/risk-settings/:wallet", async (req, res) => {
  const { wallet } = req.params;

  try {
    const database = await connectDB();
    const settings = database.collection("risk_settings");

    let userSettings = await settings.findOne({ wallet: wallet.toLowerCase() });

    // Return defaults if no settings exist
    if (!userSettings) {
      userSettings = {
        wallet: wallet.toLowerCase(),
        maxPortfolioRisk: 30,
        maxSinglePositionSize: 10,
        maxDailyLoss: 5,
        maxOpenPositions: 3,
        minBalanceReserve: 20,
        defaultStopLoss: 5,
        defaultTakeProfit: 10,
        trailingStopEnabled: true,
        trailingStopPercent: 2,
        isDefault: true,
      };
    }

    res.json({ success: true, settings: userSettings });
  } catch (err) {
    console.error("[TRADING] Risk settings fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch risk settings" });
  }
});

/**
 * POST /api/trading/risk-settings
 * Save risk management settings
 */
app.post("/api/trading/risk-settings", async (req, res) => {
  const { wallet, settings } = req.body;

  if (!wallet || !settings) {
    return res.status(400).json({ success: false, message: "Missing wallet or settings" });
  }

  try {
    const database = await connectDB();
    const settingsCollection = database.collection("risk_settings");

    await settingsCollection.updateOne(
      { wallet: wallet.toLowerCase() },
      {
        $set: {
          wallet: wallet.toLowerCase(),
          ...settings,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Risk settings saved" });
  } catch (err) {
    console.error("[TRADING] Risk settings save error:", err);
    res.status(500).json({ success: false, message: "Failed to save risk settings" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    service: "d8n-nexus-backend",
    timestamp: new Date().toISOString()
  });
});

// Initialize wallets and export
initializeWallets();

// Suppress harmless "Filter not found" errors from ethers.js polling
process.on('unhandledRejection', (reason, promise) => {
  // Ignore "Filter not found" errors from Cronos zkEVM RPC polling
  // This is normal behavior for HTTP-based RPC endpoints (filters expire)
  if (reason?.error?.message?.includes?.("Filter not found") ||
      reason?.message?.includes?.("Filter not found") ||
      reason?.shortMessage?.includes?.("could not coalesce error")) {
    return; // Silently ignore - this is expected with polling-based RPCs
  }
  // Log other unhandled rejections
  console.error('[NEXUS] ⚠️ Unhandled rejection:', reason);
});

// Initialize deposit listener on startup
if (process.env.ENABLE_DEPOSIT_LISTENER === "true") {
  startDepositListener()
    .then(() => {
      console.log("[NEXUS] ✅ Deposit listener started successfully");
    })
    .catch(error => {
      console.error("[NEXUS] ❌ Failed to start deposit listener:", error.message);
      console.error("[NEXUS] Backend will continue without automatic deposit detection");
    });
} else {
  console.log("[NEXUS] Deposit listener disabled (set ENABLE_DEPOSIT_LISTENER=true to enable)");
}

module.exports = app;

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[NEXUS] Backend server running on port ${PORT}`);
  });
}
