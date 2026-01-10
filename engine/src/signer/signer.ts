//@ts-nocheck
import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Address,
  BaseError,
  encodeFunctionData,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { mainnet, sepolia, cronos, cronosTestnet } from 'viem/chains';
import type { WalletConfig, ChimeraAction, Workflow, ExecutionOptions, SessionKeyMetadata, TransactionResult } from '../interfaces/WalletConfig.js';
import { sessionKeyManagerAbi } from '../abis/sessionKeyManagerAbi.js';

const delegateAbi = [
  {
    inputs: [
      {
        components: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
        name: 'actions',
        type: 'tuple[]',
      },
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Validate session key against SessionKeyManager contract
 */
async function validateSessionKey(
  publicClient: any,
  sessionKeyManagerAddress: Address,
  sessionKeyAddress: Address
): Promise<SessionKeyMetadata> {
  console.log(`🔑 Validating session key: ${sessionKeyAddress}`);

  // Check if session key is valid
  const isValid = await publicClient.readContract({
    address: sessionKeyManagerAddress,
    abi: sessionKeyManagerAbi,
    functionName: 'isSessionKeyValid',
    args: [sessionKeyAddress],
  });

  if (!isValid) {
    throw new Error(`Session key ${sessionKeyAddress} is not valid (inactive, expired, or not yet valid)`);
  }

  // Get session key details
  const details = await publicClient.readContract({
    address: sessionKeyManagerAddress,
    abi: sessionKeyManagerAbi,
    functionName: 'getSessionKeyDetails',
    args: [sessionKeyAddress],
  });

  const [owner, validAfter, validUntil, maxValue, spentValue, active] = details as [
    Address,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ];

  const metadata: SessionKeyMetadata = {
    key: sessionKeyAddress,
    owner,
    validAfter,
    validUntil,
    maxValue,
    spentValue,
    active,
    allowedFunctions: [], // Not directly retrievable, would need separate contract call
  };

  console.log(`✅ Session key validated:`);
  console.log(`   - Owner: ${owner}`);
  console.log(`   - Valid: ${new Date(Number(validAfter) * 1000).toISOString()} → ${new Date(Number(validUntil) * 1000).toISOString()}`);
  console.log(`   - Spending: ${spentValue} / ${maxValue} wei`);

  return metadata;
}

/**
 * Calculate total value from actions
 */
function calculateTotalValue(actions: ChimeraAction[]): bigint {
  return actions.reduce((sum, action) => sum + (action.value || 0n), 0n);
}

/**
 * Execute workflow using direct owner private key
 */
async function executeDirectMode(
  options: ExecutionOptions
): Promise<Hex> {
  const { walletConfig, actions, simulate = true } = options;

  if (!walletConfig.privateKey) {
    throw new Error('Direct mode requires privateKey in walletConfig');
  }

  // Get chain configuration first
  const chain = getChainById(walletConfig.chainId);
  
  // Create account WITHOUT chain parameter to avoid mismatch
  const account = privateKeyToAccount(walletConfig.privateKey);

  const publicClient = createPublicClient({ 
    chain, 
    transport: http(walletConfig.rpcUrl) 
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(walletConfig.rpcUrl),
  });

  console.log(`\n🤖 Executing workflow (DIRECT MODE)`);
  console.log(`   - Chain: ${chain.name} (${chain.id})`);
  console.log(`   - User: ${account.address}`);
  console.log(`   - Delegate: ${walletConfig.delegateAddress}`);

  const actionsTuples: { to: Address; value: bigint; data: Hex }[] =
    actions.map(a => ({
      to: a.to,
      value: BigInt(a.value ?? 0),
      data: a.data,
    }));

  console.log('📦 Actions to execute:');
  actionsTuples.forEach((a, i) => console.log(`  ${i + 1}: to=${a.to}, value=${a.value}, data=${a.data.slice(0, 18)}...`));

  if (simulate) {
    const { request } = await publicClient.simulateContract({
      account,
      address: walletConfig.delegateAddress,
      abi: delegateAbi,
      functionName: 'executeBatch',
      args: [actionsTuples as any],
    });
    console.log('✅ Simulation successful');
  }

  const txHash = await walletClient.writeContract({
    address: walletConfig.delegateAddress,
    abi: delegateAbi,
    functionName: 'executeBatch',
    args: [actionsTuples as any],
  });

  console.log(`✅ Transaction submitted: ${txHash}`);
  return txHash;
}

/**
 * Execute workflow using session key
 */
async function executeSessionKeyMode(
  options: ExecutionOptions
): Promise<Hex> {
  const { walletConfig, actions } = options;

  if (!walletConfig.sessionKeyPrivateKey) {
    throw new Error('Session key mode requires sessionKeyPrivateKey in walletConfig');
  }

  if (!walletConfig.sessionKeyAddress) {
    throw new Error('Session key mode requires sessionKeyAddress in walletConfig');
  }

  if (!walletConfig.sessionKeyManagerAddress) {
    throw new Error('Session key mode requires sessionKeyManagerAddress in walletConfig');
  }

  const sessionKeyAccount = privateKeyToAccount(walletConfig.sessionKeyPrivateKey);
  const chain = getChainById(walletConfig.chainId);

  const publicClient = createPublicClient({ 
    chain, 
    transport: http(walletConfig.rpcUrl) 
  });

  const walletClient = createWalletClient({
    account: sessionKeyAccount,
    chain,
    transport: http(walletConfig.rpcUrl),
  });

  console.log(`\n🔑 Executing workflow (SESSION KEY MODE)`);
  console.log(`   - Chain: ${chain.name} (${chain.id})`);
  console.log(`   - Session Key: ${walletConfig.sessionKeyAddress}`);
  console.log(`   - Delegate: ${walletConfig.delegateAddress}`);

  // Validate session key
  const metadata = await validateSessionKey(
    publicClient,
    walletConfig.sessionKeyManagerAddress,
    walletConfig.sessionKeyAddress
  );

  // Check spending limit
  const totalValue = calculateTotalValue(actions);
  const remainingValue = metadata.maxValue - metadata.spentValue;

  if (totalValue > remainingValue) {
    throw new Error(
      `Session key spending limit exceeded: requested ${totalValue} wei, remaining ${remainingValue} wei`
    );
  }

  // Encode delegate executeBatch call
  const delegateCallData = encodeFunctionData({
    abi: delegateAbi,
    functionName: 'executeBatch',
    args: [actions.map(a => ({ to: a.to, value: a.value || 0n, data: a.data }))],
  });

  console.log('📦 Encoded delegate call data');

  // Sign the transaction data with session key
  // Note: SessionKeyManager requires a signature parameter
  // For simplicity, we'll create a signature of the call data
  const message = delegateCallData;
  const signature = await sessionKeyAccount.signMessage({ message });

  console.log('✍️ Signed with session key');

  // Execute via SessionKeyManager
  const txHash = await walletClient.writeContract({
    address: walletConfig.sessionKeyManagerAddress,
    abi: sessionKeyManagerAbi,
    functionName: 'executeWithSessionKey',
    args: [
      walletConfig.sessionKeyAddress,
      walletConfig.delegateAddress,
      totalValue,
      delegateCallData,
      signature,
    ],
  });

  console.log(`✅ Transaction submitted via session key: ${txHash}`);
  return txHash;
}

/**
 * Main execution function - routes to direct or session key mode
 */
export async function executeWorkflow(options: ExecutionOptions): Promise<Hex> {
  try {
    const { walletConfig } = options;

    if (walletConfig.mode === 'session-key') {
      return await executeSessionKeyMode(options);
    } else {
      return await executeDirectMode(options);
    }
  } catch (error) {
    console.error('\n❌ Workflow execution failed:');
    if (error instanceof BaseError) {
      const revert = error.walk(e => e.name === 'ContractFunctionRevertedError');
      if (revert && 'reason' in revert) {
        console.error(`   - Revert reason: ${revert.reason}`);
      } else {
        console.error(`   - Details: ${error.shortMessage}`);
      }
    } else {
      console.error(error);
    }
    throw error;
  }
}

/**
 * Helper to get chain by ID
 */
function getChainById(chainId: number): Chain {
  console.log(`🔍 [getChainById] Looking up chain for ID: ${chainId}`);
  
  // Cronos zkEVM Testnet (Chain ID 240)
  const cronosZkEvmTestnet: Chain = {
    id: 240,
    name: 'Cronos zkEVM Testnet',
    nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://testnet.zkevm.cronos.org'] },
      public: { http: ['https://testnet.zkevm.cronos.org'] },
    },
    blockExplorers: {
      default: { name: 'Cronos zkEVM Explorer', url: 'https://explorer.zkevm.cronos.org/testnet' },
    },
    testnet: true,
  };

  const chains: Record<number, Chain> = {
    1: mainnet,
    11155111: sepolia,
    25: cronos,
    338: cronosTestnet,
    240: cronosZkEvmTestnet,
  };

  const chain = chains[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return chain;
}

