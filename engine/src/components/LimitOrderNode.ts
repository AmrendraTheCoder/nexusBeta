import type { Node } from "../interfaces/Node.js";
import type { WalletConfig, ChimeraAction } from "../interfaces/WalletConfig.js";
import { executeWorkflow } from "../signer/signer.js";
import { encodeFunctionData, maxUint256, createPublicClient, http } from "viem";
import { sepolia, mainnet, base } from "viem/chains";
import {
  Sdk,
  MakerTraits,
  Address,
  randBigInt,
  FetchProviderConnector,
  getLimitOrderV4Domain,
} from "@1inch/limit-order-sdk";
import { privateKeyToAccount } from "viem/accounts";

// ERC20 ABI for approve
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

export class LimitOrderNode implements Node {
    id: string;
    label: string;
    type: string = "limitOrder";
    inputs: Record<string, any> = {};
    outputs: Record<string, any> = {};
    walletConfig: WalletConfig | undefined;

    makerToken: string;
    takerToken: string;
    makingAmount: bigint;
    takingAmount: bigint;
    apiKey: string;
    expiresInSeconds: number;

    constructor(
        id: string, 
        label: string, 
        makerToken: string, 
        takerToken: string, 
        makingAmount: string, 
        takingAmount: string,
        walletConfig?: WalletConfig,
        apiKey?: string,
        expiresInSeconds: number = 300
    ){
        this.id = id;
        this.label = label;
        this.makerToken = makerToken;
        this.takerToken = takerToken;
        this.makingAmount = BigInt(makingAmount);
        this.takingAmount = BigInt(takingAmount);
        this.walletConfig = walletConfig;
        this.apiKey = apiKey || process.env.INCH_API_KEY || "";
        this.expiresInSeconds = expiresInSeconds;
    }

    async execute() {
        if (!this.walletConfig) {
            throw new Error("LimitOrderNode requires walletConfig to execute");
        }

        if (!this.apiKey) {
            throw new Error("LimitOrderNode requires 1inch API key");
        }

        console.log(`\n=== LimitOrderNode: ${this.label} ===`);
        console.log(`Maker Token: ${this.makerToken}`);
        console.log(`Taker Token: ${this.takerToken}`);
        console.log(`Making Amount: ${this.makingAmount.toString()}`);
        console.log(`Taking Amount: ${this.takingAmount.toString()}`);

        // Get limit order contract address from domain
        const domain = getLimitOrderV4Domain(this.walletConfig.chainId);
        const limitOrderContractAddress = domain.verifyingContract as `0x${string}`;

        console.log(`Limit Order Contract: ${limitOrderContractAddress}`);

        // Create public client to check allowance
        const publicClient = createPublicClient({
            chain: this.getChain(),
            transport: http(this.walletConfig.rpcUrl),
        });

        // Get maker address
        const makerAddress = this.walletConfig.mode === 'direct' && this.walletConfig.privateKey
            ? privateKeyToAccount(this.walletConfig.privateKey).address
            : this.walletConfig.ownerAddress;

        if (!makerAddress) {
            throw new Error("Cannot derive maker address from wallet config");
        }

        // Check current allowance
        const currentAllowance = await publicClient.readContract({
            address: this.makerToken as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [makerAddress, limitOrderContractAddress],
        }) as bigint;

        // Build actions array
        const actions: ChimeraAction[] = [];

        // Add approve action if needed
        if (currentAllowance < this.makingAmount) {
            console.log(`📦 Adding approval action (current: ${currentAllowance}, needed: ${this.makingAmount})`);
            
            const approveData = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [limitOrderContractAddress, maxUint256],
            });

            actions.push({
                to: this.makerToken as `0x${string}`,
                value: 0n,
                data: approveData,
            });
        } else {
            console.log(`✅ Sufficient allowance already exists`);
        }

        // Execute approval through signer if needed
        if (actions.length > 0) {
            const txHash = await executeWorkflow({
                walletConfig: this.walletConfig,
                actions,
                simulate: true,
            });

            console.log(`✅ Approval executed: ${txHash}`);
            this.outputs.approvalTxHash = txHash;

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log(`✅ Approval confirmed`);
        }

        // Create and submit limit order using 1inch SDK
        await this.submitLimitOrder(makerAddress);
    }

    private async submitLimitOrder(makerAddress: `0x${string}`) {
        if (!this.walletConfig) return;

        console.log(`\n📝 Creating limit order...`);

        // Initialize SDK
        const sdk = new Sdk({
            authKey: this.apiKey,
            networkId: this.walletConfig.chainId,
            httpConnector: new FetchProviderConnector(),
        });

        // Create maker traits
        const UINT_40_MAX = (1n << 40n) - 1n;
        const expiration = BigInt(Math.floor(Date.now() / 1000)) + BigInt(this.expiresInSeconds);
        const nonce = randBigInt(UINT_40_MAX);

        const makerTraits = MakerTraits.default()
            .withExpiration(expiration)
            .withNonce(nonce)
            .allowPartialFills()
            .allowMultipleFills();

        // Create order
        const order = await sdk.createOrder(
            {
                makerAsset: new Address(this.makerToken),
                takerAsset: new Address(this.takerToken),
                makingAmount: this.makingAmount,
                takingAmount: this.takingAmount,
                maker: new Address(makerAddress),
            },
            makerTraits,
        );

        // Sign order (need to use the actual private key for EIP-712 signature)
        const privateKey = this.walletConfig.mode === 'session-key'
            ? this.walletConfig.sessionKeyPrivateKey
            : this.walletConfig.privateKey;

        if (!privateKey) {
            throw new Error("Cannot access private key for signing limit order");
        }

        const account = privateKeyToAccount(privateKey);
        const typedData = order.getTypedData(this.walletConfig.chainId);

        // We need a wallet client to sign
        const { createWalletClient } = await import('viem');
        const walletClient = createWalletClient({
            account,
            chain: this.getChain(),
            transport: http(this.walletConfig.rpcUrl),
        });

        const signature = await walletClient.signTypedData({
            domain: typedData.domain,
            types: { Order: typedData.types[typedData.primaryType] },
            primaryType: typedData.primaryType,
            message: typedData.message,
        });

        console.log(`✍️ Order signed`);

        // Submit to 1inch orderbook
        try {
            const result: any = await sdk.submitOrder(order, signature);
            console.log(`✅ Limit order submitted successfully`);
            console.log(`   Result:`, result);
            this.outputs.orderResult = result;
            // Store order hash if available
            if (result && typeof result === 'object' && 'orderHash' in result) {
                this.outputs.orderHash = result.orderHash;
            }
        } catch (err) {
            console.error(`❌ Failed to submit limit order:`, err);
            throw err;
        }
    }

    private getChain() {
        if (!this.walletConfig) {
            throw new Error("No wallet config");
        }

        const chains: Record<number, any> = {
            1: mainnet,
            11155111: sepolia,
            8453: base,
            338: {
                id: 338,
                name: 'Cronos zkEVM Testnet T3',
                nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
                rpcUrls: {
                    default: { http: ['https://evm-t3.cronos.org'] },
                    public: { http: ['https://evm-t3.cronos.org'] },
                },
                blockExplorers: {
                    default: { name: 'Cronos zkEVM Explorer', url: 'https://explorer-zkevm-t0.cronos.org' },
                },
                testnet: true,
            },
            240: {
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
            },
        };

        return chains[this.walletConfig.chainId];
    }
}
