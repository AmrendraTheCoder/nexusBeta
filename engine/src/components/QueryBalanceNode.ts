import type { Node } from "../interfaces/Node.js";
import { queryNativeTokenBalance, queryERC20TokenBalance } from "../workflow_executor/balanceQuery.js";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "";

export class QueryBalanceNode implements Node {
    id: string;
    label: string;
    type: string = "queryBalance";
    inputs: Record<string, any> = {};
    outputs: { balance: string, raw: string, decimals?: number } = { balance: "0", raw: "0" };
    walletConfig = undefined;
    
    tokenAddress: string;
    walletAddress: string;
    isNative: boolean = true;

    constructor(id: string, label: string, tokenAddress: string, walletAddress: string) {
        console.log(`🔧 [QueryBalanceNode Constructor] Creating node:`);
        console.log(`   - id: ${id}`);
        console.log(`   - label: ${label}`);
        console.log(`   - tokenAddress: ${tokenAddress}`);
        console.log(`   - walletAddress: ${walletAddress}`);
        
        this.id = id;
        this.label = label;
        this.tokenAddress = tokenAddress;
        this.walletAddress = walletAddress;
        
        // If tokenAddress is empty string or "native", treat as native token
        this.isNative = !tokenAddress || tokenAddress.trim() === "" || tokenAddress.toLowerCase() === "native";
        
        console.log(`   - isNative: ${this.isNative}`);
        
        if (!this.walletAddress) {
            console.error(`❌ [QueryBalanceNode] No wallet address provided!`);
        }
    }

    async execute() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 [QueryBalanceNode] EXECUTE STARTING`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Node ID: ${this.id}`);
        console.log(`Wallet Address: ${this.walletAddress}`);
        console.log(`Token Address: ${this.tokenAddress}`);
        console.log(`Is Native: ${this.isNative}`);
        console.log(`RPC URL: ${RPC_URL}`);
        
        try {
            if (this.isNative) {
                console.log(`📊 Querying native balance...`);
                const result = await queryNativeTokenBalance({
                    chain: sepolia,
                    rpcUrl: RPC_URL,
                    walletAddress: this.walletAddress,
                });

                this.outputs.balance = result.formatted;
                this.outputs.raw = result.raw;
                
                console.log(`Native balance for ${this.walletAddress}: ${result.formatted} ETH`);
            } else {
                const result = await queryERC20TokenBalance({
                    chain: sepolia,
                    rpcUrl: RPC_URL,
                    tokenAddress: this.tokenAddress,
                    walletAddress: this.walletAddress,
                });

                this.outputs.balance = result.formatted;
                this.outputs.raw = result.raw;
                this.outputs.decimals = result.decimals;
                
                console.log(`ERC20 balance for ${this.walletAddress} (${this.tokenAddress}): ${result.formatted} tokens`);
            }
        } catch (error) {
            console.error("Error querying balance:", error);
            this.outputs.balance = "0";
            this.outputs.raw = "0";
        }
    }
}