import type { Node } from "../interfaces/Node.js";
import { NIP1Client } from "@nexus-ecosystem/nip1";
// Note: SDK uses ethers v6, but engine has v5. Import dynamically to avoid conflicts.
import * as ethersV5 from "ethers";

/**
 * NexusPayNode - Handles HTTP 402 Payment Required flow using NIP-1 SDK
 * 
 * This node uses the @nexus-ecosystem/nip1 SDK to:
 * 1. Make HTTP requests to potentially paid endpoints
 * 2. Auto-detect 402 Payment Required responses
 * 3. Sign and execute payment transactions
 * 4. Automatically retry with payment proof
 * 5. Return the unlocked data
 * 
 * @example
 * const node = new NexusPayNode(
 *   'pay-1',
 *   'Fetch Premium Data',
 *   { url: 'https://api.example.com/premium', method: 'GET' },
 *   { userPrivateKey: '0x...', chainId: 84532, rpcUrl: 'https://sepolia.base.org' }
 * );
 * await node.execute();
 * console.log(node.outputs.data);
 */

export interface NexusPayInput {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  // Nexus backend integration
  nexusBackendUrl?: string; // e.g., "http://localhost:3001"
  provider?: string; // Provider address to pay
  amount?: string; // Amount to pay (in wei or ether string)
}

export interface EngineContext {
  userPrivateKey: string;
  userAddress?: string; // Wallet address making the payment
  chainId?: number;
  rpcUrl?: string;
  maxPrice?: string;
}

export class NexusPayNode implements Node {
  id: string;
  label: string;
  type: string = "nexusPay";
  inputs: Record<string, any>;
  outputs: Record<string, any> = {};
  walletConfig = undefined;

  // Configuration
  private config: NexusPayInput;
  private context: EngineContext;
  private client: NIP1Client | null = null;

  constructor(
    id: string,
    label: string,
    config: NexusPayInput,
    context: EngineContext
  ) {
    this.id = id;
    this.label = label;
    this.config = config;
    this.context = context;
    this.inputs = { activate: true };
  }

  async execute(): Promise<void> {
    try {
      // Step 1: Validate inputs
      this.validateInputs();

      // Step 2: Initialize NIP1 Client (will record payment in beforePayment hook)
      await this.initializeClient();

      // Step 3: Record payment attempt in backend (before making request)
      // This ensures the transaction dashboard shows the attempt regardless of success/failure
      if (this.config.nexusBackendUrl) {
        await this.recordPaymentAttempt();
      }

      // Step 4: Execute request (SDK handles 402 automatically)
      console.log(`🚀 [NexusPay] Starting request to ${this.config.url}`);
      const data = await this.makeRequest();

      // Step 5: Success!
      console.log(`✅ [NexusPay] Success!`);
      this.outputs = {
        success: true,
        data,
        chainId: this.context.chainId || 84532
      };

    } catch (error: any) {
      console.error(`❌ [NexusPay] Failed:`, error.message);
      this.outputs = {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Record payment attempt to backend (called on every execution)
   * This is separate from makePaymentViaBackend which is called by SDK hooks
   */
  private async recordPaymentAttempt(): Promise<void> {
    try {
      const walletAddress = this.context.userAddress || await this.getWalletAddress();
      const nexusBackendUrl = this.config.nexusBackendUrl;
      const chainId = this.context.chainId || 240;
      
      // Use a demo provider address if not specified
      const provider = this.config.provider || '0x0000000000000000000000000000000000000001';
      // Default small amount for demo (0.001 token)
      const amount = this.config.amount || '1000000000000000'; // 0.001 in wei

      console.log(`📊 [NexusPay] Recording execution attempt to backend`);
      console.log(`   Wallet: ${walletAddress}`);
      console.log(`   URL: ${this.config.url}`);

      const response = await fetch(`${nexusBackendUrl}/api/nexus/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          provider,
          amount,
          chainId,
          metadata: {
            url: this.config.url,
            method: this.config.method || 'GET',
            nodeId: this.id,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`✅ [NexusPay] Execution recorded in dashboard`);
      } else {
        console.warn(`⚠️  [NexusPay] Backend recording: ${data.message}`);
      }
    } catch (error: any) {
      console.warn(`⚠️  [NexusPay] Could not record to backend: ${error.message}`);
    }
  }

  /**
   * Make payment via Nexus backend (called from SDK's beforePayment hook)
   * @param paymentDetails - Payment details from SDK (optional, will use config if not provided)
   */
  private async makePaymentViaBackend(paymentDetails?: any): Promise<void> {
    const walletAddress = this.context.userAddress || await this.getWalletAddress();
    
    // Use SDK payment details if provided, otherwise fall back to config
    // Convert BigInt to string if present
    const provider = this.config.provider || paymentDetails?.recipient;
    const amount = this.config.amount || 
                   (paymentDetails?.amount ? String(paymentDetails.amount) : '100000000000000000');
    const chainId = this.context.chainId || paymentDetails?.chainId || 240;
    const nexusBackendUrl = this.config.nexusBackendUrl;

    if (!provider) {
      console.warn(`⚠️  [NexusPay] No provider address available, skipping backend recording`);
      return;
    }

    console.log(`💳 [NexusPay] Recording payment in Nexus backend`);
    console.log(`   Backend: ${nexusBackendUrl}/api/nexus/pay`);
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Amount: ${amount} wei (${(Number(amount) / 1e18).toFixed(4)} CRO)`);

    try {
      const response = await fetch(`${nexusBackendUrl}/api/nexus/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          provider,
          amount,
          chainId
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [NexusPay] Payment recorded successfully!`);
        console.log(`   TxHash: ${data.txHash || 'demo-mode'}`);
        console.log(`   New Balance: ${data.newBalanceFormatted || 'unknown'} CRO`);
      } else {
        // Log warning but don't throw - in demo mode, blockchain tx might fail
        // but we still want to track the payment attempt in our database
        console.warn(`⚠️  [NexusPay] Backend returned: ${data.message}`);
        console.warn(`    (Expected in demo mode with insufficient gas)`);
      }

    } catch (error: any) {
      // Log error but don't throw - don't block workflow execution
      console.error(`❌ [NexusPay] Backend error:`, error.message);
      console.warn(`    Continuing workflow anyway...`);
    }
  }

  /**
   * Validate required inputs
   */
  private validateInputs(): void {
    if (!this.config.url) {
      throw new Error("Validation Error: Missing required field: url");
    }

    if (!this.context.userPrivateKey) {
      throw new Error("Validation Error: Missing required field: userPrivateKey");
    }

    // Validate URL format
    try {
      new URL(this.config.url);
    } catch {
      throw new Error(`Validation Error: Invalid URL format: ${this.config.url}`);
    }

    // Validate private key format
    if (!this.context.userPrivateKey.startsWith('0x') || this.context.userPrivateKey.length !== 66) {
      throw new Error("Validation Error: Invalid private key format (must be 0x + 64 hex chars)");
    }
  }

  /**
   * Initialize the NIP1Client with wallet and configuration
   */
  private async initializeClient(): Promise<void> {
    try {
      // Default to Base Sepolia if not specified
      const rpcUrl = this.context.rpcUrl || "https://sepolia.base.org";
      const chainId = this.context.chainId || 84532;

      // Create provider and wallet (ethers v5 style)
      const provider = new ethersV5.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethersV5.Wallet(this.context.userPrivateKey, provider);

      console.log(`💳 [SDK] Initializing client on chain ${chainId}`);
      console.log(`🔑 [SDK] Wallet address: ${wallet.address}`);

      // Initialize NIP1 Client
      // Note: The SDK expects ethers v6 Wallet, but v5 Wallet is compatible for our use case
      this.client = new NIP1Client({
        wallet: wallet as any, // Type cast to handle v5/v6 compatibility
        maxPrice: this.context.maxPrice || '10.0', // Max 10 tokens per payment
        autoPay: true, // Automatically handle 402 and pay
        enableCache: true, // Cache payments to prevent replay
        demoMode: false, // Real mode - execute actual blockchain transactions
        beforePayment: async (details) => {
          console.log(`💰 [SDK] Payment required: ${details.amountFormatted} to ${details.recipient}`);
          console.log(`⛓️  [SDK] Chain: ${details.chainId}`);
          
          // Record payment in Nexus backend (use SDK details if config missing)
          if (this.config.nexusBackendUrl) {
            try {
              await this.makePaymentViaBackend(details);
            } catch (err: any) {
              console.error(`❌ [NexusPay] Backend recording error:`, err.message);
            }
          }
          
          return true; // Confirm payment
        },
        afterPayment: async (txHash, details) => {
          console.log(`✅ [SDK] Payment confirmed: ${txHash}`);
          // Record the real txHash in production
        }
      });

    } catch (error: any) {
      throw new Error(`Client Initialization Failed: ${error.message}`);
    }
  }

  /**
   * Make the HTTP request using NIP1Client
   * The SDK automatically handles 402 responses
   */
  private async makeRequest(): Promise<any> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    const method = this.config.method || 'GET';
    const url = this.config.url;

    try {
      let data: any;

      switch (method.toUpperCase()) {
        case 'GET':
          data = await this.client.get(url);
          break;
        
        case 'POST':
          data = await this.client.post(url, this.config.body);
          break;
        
        case 'PUT':
        case 'DELETE':
          data = await this.client.request({
            method,
            url,
            data: this.config.body,
            ...(this.config.headers && { headers: this.config.headers })
          });
          break;
        
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return data;

    } catch (error: any) {
      // Handle specific error types
      if (error.message?.includes('Payment required')) {
        throw new Error('Payment Required: Auto-pay failed. Check wallet balance and max price.');
      }
      
      if (error.message?.includes('ECONNREFUSED')) {
        throw new Error(`Network Error: Cannot connect to ${url}. Is the server running?`);
      }

      if (error.response?.status === 402) {
        throw new Error('Payment Required: 402 received but auto-pay is disabled');
      }

      throw new Error(`Request Failed: ${error.message}`);
    }
  }

  /**
   * Get wallet address from private key
   */
  private async getWalletAddress(): Promise<string> {
    try {
      const wallet = new ethersV5.Wallet(this.context.userPrivateKey);
      return wallet.address;
    } catch (error: any) {
      throw new Error(`Failed to get wallet address: ${error.message}`);
    }
  }

  /**
   * Get payment history from the client
   * Note: This method is not yet implemented in the SDK
   */
  getPaymentHistory(): Array<{ txHash: string; cost: string; chainId: number }> {
    return [];
  }

  /**
   * Clear payment cache
   */
  clearPaymentCache(): void {
    this.client?.clearCache();
    console.log(`🧹 [NexusPay] Payment cache cleared`);
  }
}
