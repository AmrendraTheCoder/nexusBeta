/**
 * Cross-Chain Action Executor
 * Enables workflow actions across different blockchain networks
 * Uses Chainlink CCIP or LayerZero for cross-chain messaging
 */

import {
    createWalletClient,
    createPublicClient,
    http,
    encodeFunctionData,
    type Address,
    type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Supported chains for cross-chain actions
export const CROSS_CHAIN_CONFIG = {
    // Ethereum Sepolia
    11155111: {
        name: "Ethereum Sepolia",
        rpc: "https://rpc.sepolia.org",
        ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
        layerZeroEndpoint: "0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3",
        chainSelector: "16015286601757825753", // CCIP chain selector
    },
    // Base Sepolia
    84532: {
        name: "Base Sepolia",
        rpc: "https://sepolia.base.org",
        ccipRouter: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
        layerZeroEndpoint: "0x55370E0fBB5f5b8dAeD978BA1c075a499eB107B8",
        chainSelector: "10344971235874465080",
    },
    // Polygon Amoy
    80002: {
        name: "Polygon Amoy",
        rpc: "https://rpc-amoy.polygon.technology",
        ccipRouter: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
        layerZeroEndpoint: "0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3",
        chainSelector: "16281711391670634445",
    },
};

// Cross-chain message types
export interface CrossChainMessage {
    sourceChain: number;
    destinationChain: number;
    sender: Address;
    receiver: Address;
    data: Hex;
    value: bigint;
    gasLimit: bigint;
}

// CCIP Router minimal ABI
const CCIP_ROUTER_ABI = [
    {
        name: "ccipSend",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "destinationChainSelector", type: "uint64" },
            {
                name: "message",
                type: "tuple",
                components: [
                    { name: "receiver", type: "bytes" },
                    { name: "data", type: "bytes" },
                    { name: "tokenAmounts", type: "tuple[]", components: [
                        { name: "token", type: "address" },
                        { name: "amount", type: "uint256" }
                    ]},
                    { name: "feeToken", type: "address" },
                    { name: "extraArgs", type: "bytes" }
                ]
            }
        ],
        outputs: [{ name: "messageId", type: "bytes32" }]
    },
    {
        name: "getFee",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "destinationChainSelector", type: "uint64" },
            { name: "message", type: "tuple", components: [
                { name: "receiver", type: "bytes" },
                { name: "data", type: "bytes" },
                { name: "tokenAmounts", type: "tuple[]", components: [
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" }
                ]},
                { name: "feeToken", type: "address" },
                { name: "extraArgs", type: "bytes" }
            ]}
        ],
        outputs: [{ name: "fee", type: "uint256" }]
    }
];

export interface CrossChainActionOptions {
    privateKey: Hex;
    sourceChainId: number;
    destinationChainId: number;
    receiver: Address;
    actionData: Hex; // Encoded function call for destination
    value?: bigint;
}

/**
 * Send a cross-chain message using Chainlink CCIP
 */
export async function sendCrossChainAction(options: CrossChainActionOptions): Promise<string> {
    const {
        privateKey,
        sourceChainId,
        destinationChainId,
        receiver,
        actionData,
        value = 0n,
    } = options;

    const sourceConfig = CROSS_CHAIN_CONFIG[sourceChainId as keyof typeof CROSS_CHAIN_CONFIG];
    const destConfig = CROSS_CHAIN_CONFIG[destinationChainId as keyof typeof CROSS_CHAIN_CONFIG];

    if (!sourceConfig || !destConfig) {
        throw new Error(`Unsupported chain: ${sourceChainId} or ${destinationChainId}`);
    }

    const account = privateKeyToAccount(privateKey);
    
    const walletClient = createWalletClient({
        account,
        chain: { id: sourceChainId, name: sourceConfig.name } as any,
        transport: http(sourceConfig.rpc),
    });

    const publicClient = createPublicClient({
        chain: { id: sourceChainId, name: sourceConfig.name } as any,
        transport: http(sourceConfig.rpc),
    });

    console.log("=== Cross-Chain Action via CCIP ===");
    console.log(`Source: ${sourceConfig.name} (${sourceChainId})`);
    console.log(`Destination: ${destConfig.name} (${destinationChainId})`);
    console.log(`Receiver: ${receiver}`);

    // Prepare CCIP message
    const ccipMessage = {
        receiver: receiver as `0x${string}`, // Encoded as bytes
        data: actionData,
        tokenAmounts: [], // No token transfers in this example
        feeToken: "0x0000000000000000000000000000000000000000" as Address, // Pay in native
        extraArgs: "0x" as Hex, // Default extra args
    };

    // Get fee estimate
    const fee = await publicClient.readContract({
        address: sourceConfig.ccipRouter as Address,
        abi: CCIP_ROUTER_ABI,
        functionName: "getFee",
        args: [BigInt(destConfig.chainSelector), ccipMessage],
    }) as bigint;

    console.log(`CCIP Fee: ${fee.toString()} wei`);

    // Send cross-chain message
    const txHash = await walletClient.writeContract({
        address: sourceConfig.ccipRouter as Address,
        abi: CCIP_ROUTER_ABI,
        functionName: "ccipSend",
        args: [BigInt(destConfig.chainSelector), ccipMessage],
        value: fee + value,
        chain: { id: sourceChainId, name: sourceConfig.name } as any,
    });

    console.log(`Cross-chain message sent: ${txHash}`);
    return txHash;
}

/**
 * Build action data for a cross-chain swap
 */
export function buildCrossChainSwapData(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    recipient: Address
): Hex {
    // This would be the encoded function call for the destination chain
    // In production, this would encode a swap call on the destination DEX
    return encodeFunctionData({
        abi: [{
            name: "swap",
            type: "function",
            inputs: [
                { name: "tokenIn", type: "address" },
                { name: "tokenOut", type: "address" },
                { name: "amountIn", type: "uint256" },
                { name: "recipient", type: "address" }
            ],
            outputs: []
        }],
        functionName: "swap",
        args: [tokenIn, tokenOut, amountIn, recipient]
    });
}

/**
 * Check if a cross-chain route is supported
 */
export function isRouteSupported(sourceChainId: number, destChainId: number): boolean {
    return (
        sourceChainId in CROSS_CHAIN_CONFIG &&
        destChainId in CROSS_CHAIN_CONFIG &&
        sourceChainId !== destChainId
    );
}

/**
 * Get supported destination chains from a source
 */
export function getDestinationChains(sourceChainId: number): number[] {
    return Object.keys(CROSS_CHAIN_CONFIG)
        .map(Number)
        .filter(id => id !== sourceChainId);
}
