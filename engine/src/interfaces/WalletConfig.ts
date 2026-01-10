/**
 * Wallet configuration for executing transactions
 * Used by nodes to know which wallet to use and how to execute
 */
export interface WalletConfig {
  /** Execution mode: "direct" uses owner's private key, "session-key" uses authorized session key */
  mode: "direct" | "session-key";
  
  /** Private key for direct execution (owner's key) */
  privateKey?: `0x${string}`;
  
  /** Session key private key (for session-key mode) */
  sessionKeyPrivateKey?: `0x${string}`;
  
  /** Session key address (derived from sessionKeyPrivateKey) */
  sessionKeyAddress?: `0x${string}`;
  
  /** Owner's wallet address (for session key validation) */
  ownerAddress?: `0x${string}`;
  
  /** User's connected wallet address (from frontend - for payment recording) */
  userAddress?: string;
  
  /** Chain ID for the target blockchain */
  chainId: number;
  
  /** RPC URL for connecting to the blockchain */
  rpcUrl: string;
  
  /** Delegate contract address (Chimera delegate pattern) */
  delegateAddress: `0x${string}`;
  
  /** SessionKeyManager contract address (for session key validation) */
  sessionKeyManagerAddress?: `0x${string}`;
}

/**
 * Execution options for the signer service
 */
export interface ExecutionOptions {
  /** Wallet configuration */
  walletConfig: WalletConfig;
  
  /** Array of actions to execute in a batch */
  actions: ChimeraAction[];
  
  /** Whether to simulate before executing */
  simulate?: boolean;
  
  /** Gas limit override */
  gasLimit?: bigint;
  
  /** Max fee per gas override */
  maxFeePerGas?: bigint;
  
  /** Max priority fee per gas override */
  maxPriorityFeePerGas?: bigint;
}

/**
 * Chimera action for batch execution through delegate contract
 */
export interface ChimeraAction {
  /** Target contract address */
  to: `0x${string}`;
  
  /** ETH value to send */
  value: bigint;
  
  /** Encoded function call data */
  data: `0x${string}`;
}

/**
 * Workflow structure for batch execution
 */
export interface Workflow {
  /** Array of actions to execute */
  actions: ChimeraAction[];
}

/**
 * Session key metadata for validation
 */
export interface SessionKeyMetadata {
  /** Session key address */
  key: `0x${string}`;
  
  /** Owner wallet address */
  owner: `0x${string}`;
  
  /** Timestamp when key becomes valid */
  validAfter: bigint;
  
  /** Timestamp when key expires */
  validUntil: bigint;
  
  /** Maximum cumulative ETH value this key can spend */
  maxValue: bigint;
  
  /** Total value already spent */
  spentValue: bigint;
  
  /** Whether the key is currently active */
  active: boolean;
  
  /** Function selectors this key is allowed to call */
  allowedFunctions: `0x${string}`[];
}

/**
 * Transaction execution result
 */
export interface TransactionResult {
  /** Transaction hash */
  hash: `0x${string}`;
  
  /** Block number where transaction was mined */
  blockNumber?: bigint;
  
  /** Gas used */
  gasUsed?: bigint;
  
  /** Transaction status */
  status: "pending" | "success" | "failed";
  
  /** Error message if failed */
  error?: string;
}
