/**
 * @fileoverview NexusTreasury Deposit Event Listener
 * Monitors blockchain for Deposited events and automatically credits virtual balances
 * 
 * Features:
 * - Real-time event listening on Cronos zkEVM
 * - Automatic virtual balance crediting
 * - Transaction deduplication
 * - RPC reconnection logic
 * - Historical sync from specific block
 * - Comprehensive error handling
 * 
 * @author Nexus Team
 * @version 1.0.0
 */

const { ethers } = require("ethers");
const { MongoClient } = require("mongodb");

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Enable/disable listener via environment variable
  enabled: process.env.ENABLE_DEPOSIT_LISTENER === "true",
  
  // Cronos zkEVM Testnet configuration
  chainId: 240,
  rpcUrl: process.env.CRONOS_RPC_URL || "https://testnet.zkevm.cronos.org",
  treasuryAddress: "0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7",
  
  // MongoDB connection
  mongoUri: process.env.MONGO_URI || 
    "mongodb+srv://harshitacademia_db_user:i9B8EJejeTvBZEQw@decluster8n.htjwxef.mongodb.net/?retryWrites=true&w=majority&appName=decluster8n",
  
  // Reconnection settings
  reconnectDelay: 5000, // 5 seconds
  maxReconnectAttempts: 10,
  
  // Sync settings
  syncFromBlock: (() => {
    const val = process.env.SYNC_FROM_BLOCK;
    if (!val || val === 'latest') return null;
    const num = parseInt(val);
    return isNaN(num) ? null : num;
  })(),
  
  // Polling interval (fallback if websocket not available)
  pollingInterval: 12000, // 12 seconds (Cronos block time)
};

// NexusTreasury ABI - only the events and functions we need
const TREASURY_ABI = [
  "event Deposited(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp)",
  "function deposits(address) view returns (uint256)",
  "function MIN_DEPOSIT() view returns (uint256)"
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class DepositListener {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.mongoClient = null;
    this.db = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.lastProcessedBlock = null;
  }

  /**
   * Initialize connections to blockchain and database
   */
  async initialize() {
    try {
      console.log("[DEPOSIT-LISTENER] Initializing...");
      
      // Connect to MongoDB - if it fails, return false
      const mongoConnected = await this.connectMongoDB();
      if (!mongoConnected) {
        return false;
      }
      
      // Connect to blockchain
      await this.connectBlockchain();
      
      // Load last processed block from database
      await this.loadLastProcessedBlock();
      
      console.log("[DEPOSIT-LISTENER] Initialization complete");
      return true;
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Initialization failed:", error);
      return false;
    }
  }

  /**
   * Connect to MongoDB
   */
  async connectMongoDB() {
    try {
      this.mongoClient = new MongoClient(CONFIG.mongoUri, {
        serverApi: {
          version: "1",
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000, // Quick timeout
        connectTimeoutMS: 5000
      });

      await this.mongoClient.connect();
      this.db = this.mongoClient.db("d8n_main");
      console.log("[DEPOSIT-LISTENER] Connected to MongoDB");
      return true;
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] MongoDB connection failed:", error);
      console.warn("[DEPOSIT-LISTENER] Listener will be disabled (MongoDB required for deposit tracking)");
      return false;
    }
  }

  /**
   * Connect to blockchain RPC
   */
  async connectBlockchain() {
    try {
      // Create provider with connection info for better error handling
      this.provider = new ethers.JsonRpcProvider(
        CONFIG.rpcUrl,
        {
          chainId: CONFIG.chainId,
          name: "Cronos zkEVM Testnet"
        }
      );

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`[DEPOSIT-LISTENER] Connected to chain: ${network.name} (${network.chainId})`);

      // Create contract instance
      this.contract = new ethers.Contract(
        CONFIG.treasuryAddress,
        TREASURY_ABI,
        this.provider
      );

      // Verify contract is accessible
      const minDeposit = await this.contract.MIN_DEPOSIT();
      console.log(`[DEPOSIT-LISTENER] Treasury contract verified. MIN_DEPOSIT: ${ethers.formatEther(minDeposit)} CRO`);

      this.reconnectAttempts = 0;
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Blockchain connection failed:", error);
      throw error;
    }
  }

  /**
   * Load last processed block from database
   */
  async loadLastProcessedBlock() {
    try {
      const metadata = this.db.collection("listener_metadata");
      const doc = await metadata.findOne({ listenerId: "deposit_listener" });
      
      if (doc?.lastProcessedBlock) {
        this.lastProcessedBlock = doc.lastProcessedBlock;
        console.log(`[DEPOSIT-LISTENER] Resuming from block ${this.lastProcessedBlock}`);
      } else if (CONFIG.syncFromBlock) {
        this.lastProcessedBlock = parseInt(CONFIG.syncFromBlock);
        console.log(`[DEPOSIT-LISTENER] Starting sync from block ${this.lastProcessedBlock}`);
      } else {
        // Start from current block
        this.lastProcessedBlock = await this.provider.getBlockNumber();
        console.log(`[DEPOSIT-LISTENER] Starting from current block ${this.lastProcessedBlock}`);
      }
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Failed to load last processed block:", error);
      this.lastProcessedBlock = await this.provider.getBlockNumber();
    }
  }

  /**
   * Save last processed block to database
   */
  async saveLastProcessedBlock(blockNumber) {
    try {
      const metadata = this.db.collection("listener_metadata");
      await metadata.updateOne(
        { listenerId: "deposit_listener" },
        { 
          $set: { 
            lastProcessedBlock: blockNumber,
            lastUpdated: new Date()
          } 
        },
        { upsert: true }
      );
      this.lastProcessedBlock = blockNumber;
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Failed to save last processed block:", error);
    }
  }

  /**
   * Check if transaction has already been processed
   */
  async isTransactionProcessed(txHash) {
    try {
      const deposits = this.db.collection("nexus_deposits");
      const existing = await deposits.findOne({ txHash });
      return !!existing;
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Error checking transaction:", error);
      return false; // Process anyway if check fails
    }
  }

  /**
   * Process a deposit event
   */
  async processDepositEvent(event) {
    try {
      const { user, amount, newBalance, timestamp } = event.args;
      const txHash = event.log.transactionHash;
      const blockNumber = event.log.blockNumber;

      console.log(`[DEPOSIT-LISTENER] Processing deposit:`);
      console.log(`  User: ${user}`);
      console.log(`  Amount: ${ethers.formatEther(amount)} CRO`);
      console.log(`  New Balance: ${ethers.formatEther(newBalance)} CRO`);
      console.log(`  Tx: ${txHash}`);
      console.log(`  Block: ${blockNumber}`);

      // Check if already processed
      const alreadyProcessed = await this.isTransactionProcessed(txHash);
      if (alreadyProcessed) {
        console.log(`[DEPOSIT-LISTENER] Transaction ${txHash} already processed, skipping`);
        return;
      }

      // Credit virtual balance
      await this.creditVirtualBalance(user, amount, txHash, blockNumber);

      // Save last processed block
      await this.saveLastProcessedBlock(blockNumber);

      console.log(`[DEPOSIT-LISTENER] ✅ Deposit processed successfully`);
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Error processing deposit event:", error);
      // Don't throw - continue processing other events
    }
  }

  /**
   * Credit virtual balance in MongoDB
   */
  async creditVirtualBalance(wallet, amount, txHash, blockNumber) {
    try {
      const balances = this.db.collection("nexus_balances");
      const deposits = this.db.collection("nexus_deposits");
      const transactions = this.db.collection("nexus_transactions");

      const walletLower = wallet.toLowerCase();
      const amountString = amount.toString();

      // Record deposit
      await deposits.insertOne({
        wallet: walletLower,
        chainId: CONFIG.chainId,
        amount: amountString,
        txHash,
        blockNumber,
        processedAt: new Date(),
        processedBy: "deposit_listener"
      });

      // Update or create virtual balance
      const existingBalance = await balances.findOne({ 
        wallet: walletLower, 
        chainId: CONFIG.chainId 
      });

      if (existingBalance) {
        // Increment existing balance
        const currentBalance = BigInt(existingBalance.virtualBalance || "0");
        const newBalance = (currentBalance + amount).toString();
        
        await balances.updateOne(
          { wallet: walletLower, chainId: CONFIG.chainId },
          { 
            $set: { 
              virtualBalance: newBalance,
              updatedAt: new Date()
            }
          }
        );

        console.log(`[DEPOSIT-LISTENER] Updated balance for ${walletLower}: ${ethers.formatEther(newBalance)} CRO`);
      } else {
        // Create new balance entry
        await balances.insertOne({
          wallet: walletLower,
          chainId: CONFIG.chainId,
          virtualBalance: amountString,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`[DEPOSIT-LISTENER] Created balance for ${walletLower}: ${ethers.formatEther(amountString)} CRO`);
      }

      // Record transaction
      await transactions.insertOne({
        wallet: walletLower,
        type: "deposit",
        chainId: CONFIG.chainId,
        amount: amountString,
        txHash,
        blockNumber,
        timestamp: new Date(),
        status: "completed",
        source: "deposit_listener"
      });

    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Error crediting virtual balance:", error);
      throw error;
    }
  }

  /**
   * Sync historical events from a specific block range
   */
  async syncHistoricalEvents(fromBlock, toBlock) {
    try {
      console.log(`[DEPOSIT-LISTENER] Syncing historical events from block ${fromBlock} to ${toBlock}`);

      const filter = this.contract.filters.Deposited();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      console.log(`[DEPOSIT-LISTENER] Found ${events.length} historical deposit events`);

      for (const event of events) {
        await this.processDepositEvent(event);
      }

      console.log(`[DEPOSIT-LISTENER] Historical sync complete`);
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Historical sync failed:", error);
      throw error;
    }
  }

  /**
   * Start listening for new deposit events using polling
   * (event filters not supported reliably on Cronos zkEVM RPC)
   */
  async start() {
    if (!CONFIG.enabled) {
      console.log("[DEPOSIT-LISTENER] Listener disabled via ENABLE_DEPOSIT_LISTENER environment variable");
      return;
    }

    if (this.isRunning) {
      console.log("[DEPOSIT-LISTENER] Listener already running");
      return;
    }

    try {
      // Initialize if not already done
      if (!this.provider || !this.db) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn("[DEPOSIT-LISTENER] Could not initialize - listener disabled");
          return;
        }
      }

      this.isRunning = true;

      // Sync historical events if needed
      if (CONFIG.syncFromBlock) {
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = parseInt(CONFIG.syncFromBlock);
        
        if (fromBlock < currentBlock) {
          await this.syncHistoricalEvents(fromBlock, currentBlock);
        }
      }

      // Use polling-based approach instead of event filters
      // (Cronos zkEVM RPC doesn't support persistent filters)
      console.log("[DEPOSIT-LISTENER] Starting polling-based event monitoring...");
      console.log(`[DEPOSIT-LISTENER] Polling interval: ${CONFIG.pollingInterval / 1000}s`);
      
      // Start polling loop
      this.pollForEvents();

      console.log("[DEPOSIT-LISTENER] ✅ Listener started successfully");
      console.log(`[DEPOSIT-LISTENER] Watching treasury: ${CONFIG.treasuryAddress}`);
      console.log(`[DEPOSIT-LISTENER] Chain ID: ${CONFIG.chainId}`);

    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Failed to start listener:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Poll for new deposit events (used instead of event filters for RPC compatibility)
   */
  async pollForEvents() {
    if (!this.isRunning) return;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // Only query if there are new blocks
      if (currentBlock > this.lastProcessedBlock) {
        const fromBlock = this.lastProcessedBlock + 1;
        const toBlock = currentBlock;
        
        const filter = this.contract.filters.Deposited();
        const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
        
        if (events.length > 0) {
          console.log(`[DEPOSIT-LISTENER] Found ${events.length} new deposit event(s) in blocks ${fromBlock}-${toBlock}`);
          
          for (const event of events) {
            await this.processDepositEvent(event);
          }
        }
        
        // Update last processed block
        await this.saveLastProcessedBlock(currentBlock);
      }
    } catch (error) {
      // Silence common RPC errors and continue polling
      if (!error?.message?.includes("Filter not found")) {
        console.error("[DEPOSIT-LISTENER] Polling error:", error.message || error);
      }
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.pollForEvents(), CONFIG.pollingInterval);
    }
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  async handleDisconnection() {
    if (!this.isRunning) return;

    this.reconnectAttempts++;

    if (this.reconnectAttempts > CONFIG.maxReconnectAttempts) {
      console.error("[DEPOSIT-LISTENER] Max reconnection attempts reached. Stopping listener.");
      await this.stop();
      return;
    }

    console.log(`[DEPOSIT-LISTENER] Attempting to reconnect (${this.reconnectAttempts}/${CONFIG.maxReconnectAttempts})...`);

    try {
      // Remove old listeners
      this.contract.removeAllListeners();

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, CONFIG.reconnectDelay));

      // Reconnect
      await this.connectBlockchain();
      
      // Restart listener
      this.isRunning = false;
      await this.start();

      console.log("[DEPOSIT-LISTENER] ✅ Reconnected successfully");
    } catch (error) {
      console.error("[DEPOSIT-LISTENER] Reconnection failed:", error);
      setTimeout(() => this.handleDisconnection(), CONFIG.reconnectDelay);
    }
  }

  /**
   * Stop the listener
   */
  async stop() {
    console.log("[DEPOSIT-LISTENER] Stopping listener...");
    
    this.isRunning = false;

    // Clear polling timeout
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }

    if (this.contract) {
      this.contract.removeAllListeners();
    }

    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider.destroy();
    }

    if (this.mongoClient) {
      await this.mongoClient.close();
    }

    console.log("[DEPOSIT-LISTENER] Listener stopped");
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      enabled: CONFIG.enabled,
      lastProcessedBlock: this.lastProcessedBlock,
      reconnectAttempts: this.reconnectAttempts,
      treasuryAddress: CONFIG.treasuryAddress,
      chainId: CONFIG.chainId,
      rpcUrl: CONFIG.rpcUrl
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let listenerInstance = null;

/**
 * Get or create the listener instance
 */
function getListener() {
  if (!listenerInstance) {
    listenerInstance = new DepositListener();
  }
  return listenerInstance;
}

/**
 * Start the deposit listener (called from server.js)
 */
async function startDepositListener() {
  const listener = getListener();
  await listener.start();
  return listener;
}

/**
 * Stop the deposit listener
 */
async function stopDepositListener() {
  if (listenerInstance) {
    await listenerInstance.stop();
    listenerInstance = null;
  }
}

/**
 * Get listener status
 */
function getListenerStatus() {
  return listenerInstance ? listenerInstance.getStatus() : { isRunning: false, enabled: CONFIG.enabled };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  startDepositListener,
  stopDepositListener,
  getListenerStatus,
  DepositListener,
  CONFIG
};

// ============================================================================
// STANDALONE EXECUTION (for testing)
// ============================================================================

if (require.main === module) {
  console.log("=".repeat(60));
  console.log("NEXUS DEPOSIT LISTENER - STANDALONE MODE");
  console.log("=".repeat(60));
  
  const listener = getListener();
  
  listener.start().then(() => {
    console.log("\n✅ Listener started in standalone mode");
    console.log("Press Ctrl+C to stop\n");
  }).catch(error => {
    console.error("\n❌ Failed to start listener:", error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\nShutting down...");
    await listener.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n\nShutting down...");
    await listener.stop();
    process.exit(0);
  });
}
