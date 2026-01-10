import type { Node } from "../interfaces/Node.js";
import type { WalletConfig, ChimeraAction } from "../interfaces/WalletConfig.js";
import { executeWorkflow } from "../signer/signer.js";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ROUTER_ADDRESS: string = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

// Minimal ERC20 ABI for approve
const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "remaining", type: "uint256" }],
  },
];

// Uniswap V2 Router ABI
const uniswapV2RouterAbi = [
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
];

const UINT256_MAX = (BigInt(1) << BigInt(256)) - BigInt(1);

export class UniswapNode implements Node {
    id: string;
    label: string;
    type: string = "swap";
    inputs: Record<string, any> = {};
    outputs: Record<string, any> = {};
    walletConfig: WalletConfig | undefined;

    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    routerAddress: string | undefined;
    recipientAddress: string | undefined;
    deadlineSeconds: number;

    constructor(
        id: string, 
        label: string, 
        tokenIn: string, 
        tokenOut: string, 
        amountIn: bigint, 
        amountOutMin: bigint,
        walletConfig?: WalletConfig,
        routerAddress?: string,
        recipientAddress?: string,
        deadlineSeconds: number = 1200
    ){
        this.id = id;
        this.label = label;
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.amountIn = amountIn;
        this.amountOutMin = amountOutMin;
        this.walletConfig = walletConfig;
        this.routerAddress = routerAddress || ROUTER_ADDRESS;
        this.recipientAddress = recipientAddress;
        this.deadlineSeconds = deadlineSeconds;
    }

    async execute(){
        if (!this.walletConfig) {
            throw new Error("UniswapNode requires walletConfig to execute");
        }

        console.log(`\n=== UniswapNode: ${this.label} ===`);
        console.log(`TokenIn: ${this.tokenIn}`);
        console.log(`TokenOut: ${this.tokenOut}`);
        console.log(`AmountIn: ${this.amountIn.toString()}`);
        console.log(`AmountOutMin: ${this.amountOutMin.toString()}`);

        // Derive recipient address from wallet config
        const recipient = this.recipientAddress || 
            (this.walletConfig.mode === 'direct' && this.walletConfig.privateKey
                ? privateKeyToAccount(this.walletConfig.privateKey as `0x${string}`).address
                : this.walletConfig.ownerAddress);

        if (!recipient) {
            throw new Error("Cannot derive recipient address from wallet config");
        }

        const deadline = BigInt(Math.floor(Date.now() / 1000) + this.deadlineSeconds);
        const path = [this.tokenIn as `0x${string}`, this.tokenOut as `0x${string}`];

        // Build ChimeraAction array
        const actions: ChimeraAction[] = [];

        // Check if we need to approve (we'll approve max for simplicity in batch execution)
        // In a real scenario, you'd check current allowance first
        
        // Action 1: Approve tokenIn to router
        const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [this.routerAddress as `0x${string}`, UINT256_MAX],
        });

        actions.push({
            to: this.tokenIn as `0x${string}`,
            value: 0n,
            data: approveData,
        });

        // Action 2: Swap tokens
        const swapData = encodeFunctionData({
            abi: uniswapV2RouterAbi,
            functionName: 'swapExactTokensForTokens',
            args: [
                this.amountIn,
                this.amountOutMin,
                path,
                recipient as `0x${string}`,
                deadline,
            ],
        });

        actions.push({
            to: this.routerAddress as `0x${string}`,
            value: 0n,
            data: swapData,
        });

        console.log(`📦 Building ${actions.length} actions for swap`);

        // Execute through signer service
        const txHash = await executeWorkflow({
            walletConfig: this.walletConfig,
            actions,
            simulate: true,
        });

        console.log(`✅ Swap executed: ${txHash}`);
        this.outputs.txHash = txHash;
        this.outputs.recipient = recipient;
    }
}
