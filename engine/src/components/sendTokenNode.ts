import type { Node } from "../interfaces/Node.js";
import type { WalletConfig, ChimeraAction } from "../interfaces/WalletConfig.js";
import { executeWorkflow } from "../signer/signer.js";
import { encodeFunctionData, parseEther } from "viem";

// Minimal ERC20 ABI for transfer
const erc20Abi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

export class sendTokenNode implements Node {
  id: string;
  label: string;
  type: string = "sendToken";
  inputs: Record<string, any> = {};
  outputs: { txHash: string } = { txHash: "" };
  walletConfig: WalletConfig | undefined;

  is_native: boolean = true;
  tokenAddress: string = "";
  destination: string;
  amount: string;

  constructor(
    id: string,
    label: string,
    tokenAddress: string,
    destination: string,
    amount: string,
    walletConfig?: WalletConfig
  ) {
    console.log(`🔧 [sendTokenNode Constructor] Creating node:`);
    console.log(`   - id: ${id}`);
    console.log(`   - label: ${label}`);
    console.log(`   - tokenAddress: ${tokenAddress}`);
    console.log(`   - destination: ${destination}`);
    console.log(`   - amount: ${amount}`);
    console.log(`   - walletConfig mode: ${walletConfig?.mode || 'none'}`);
    
    this.id = id;
    this.label = label;
    
    // Check if it's a native token (empty, "native", or "0x0")
    const isNativeToken = !tokenAddress || 
                          tokenAddress.trim() === "" || 
                          tokenAddress.toLowerCase() === "native" ||
                          tokenAddress === "0x0" ||
                          tokenAddress === "0x0000000000000000000000000000000000000000";
    
    console.log(`   - isNativeToken: ${isNativeToken}`);
    
    if (!isNativeToken) {
      this.tokenAddress = tokenAddress;
      this.is_native = false;
    }

    this.destination = destination;
    this.amount = amount;
    this.walletConfig = walletConfig;
    
    // Validation warnings
    if (!this.destination) {
      console.error(`❌ [sendTokenNode] No destination address provided!`);
    }
    if (!this.amount) {
      console.error(`❌ [sendTokenNode] No amount provided!`);
    }
    if (!this.walletConfig) {
      console.warn(`⚠️ [sendTokenNode] No wallet config provided!`);
    }
  }

  async execute() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 [sendTokenNode] EXECUTE STARTING`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Node ID: ${this.id}`);
    console.log(`Label: ${this.label}`);
    console.log(`Type: ${this.is_native ? 'Native Token' : 'ERC20 Token'}`);
    console.log(`Token Address: ${this.tokenAddress || 'N/A (native)'}`);
    console.log(`Destination: ${this.destination}`);
    console.log(`Amount: ${this.amount}`);
    console.log(`Wallet Config: ${this.walletConfig ? 'Present' : 'MISSING'}`);
    
    if (!this.walletConfig) {
      console.error(`❌ [sendTokenNode] No walletConfig available!`);
      throw new Error("sendTokenNode requires walletConfig to execute");
    }
    
    if (!this.destination) {
      console.error(`❌ [sendTokenNode] No destination address!`);
      throw new Error("sendTokenNode requires destination address");
    }
    
    if (!this.amount) {
      console.error(`❌ [sendTokenNode] No amount specified!`);
      throw new Error("sendTokenNode requires amount");
    }

    const actions: ChimeraAction[] = [];

    if (this.is_native) {
      // Send native token (ETH/CRO)
      // Native transfers don't need calldata, just value
      actions.push({
        to: this.destination as `0x${string}`,
        value: parseEther(this.amount),
        data: '0x' as `0x${string}`,
      });

      console.log(`📦 Sending ${this.amount} native token to ${this.destination}`);
    } else {
      // Send ERC20 token
      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          this.destination as `0x${string}`,
          BigInt(this.amount),
        ],
      });

      actions.push({
        to: this.tokenAddress as `0x${string}`,
        value: 0n,
        data: transferData,
      });

      console.log(`📦 Transferring ${this.amount} of token ${this.tokenAddress} to ${this.destination}`);
    }

    // Execute through signer service
    const txHash = await executeWorkflow({
      walletConfig: this.walletConfig,
      actions,
      simulate: true,
    });

    this.outputs.txHash = txHash;
    console.log(`✅ Token sent: ${txHash}`);
    
    return {
      txHash,
      amount: this.amount,
      token: this.is_native ? 'Native' : this.tokenAddress,
      destination: this.destination
    };
  }
}

