import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";
import { ethers } from "ethers";

/**
 * Yield Optimizer Agent - Autonomous AI agent that optimizes DeFi yields
 * Compares APYs, calculates gas costs, and decides on rebalancing
 */

interface APYData {
  protocol: string;
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  tvl: string;
  chain: string;
  pool: string;
}

interface RebalanceDecision {
  action: "REBALANCE" | "HOLD" | "WAIT";
  shouldRebalance: boolean;
  fromProtocol: string | null;
  toProtocol: string | null;
  expectedGainPercent: number;
  expectedGainAmount: string;
  gasCostEstimate: string;
  netProfit: string;
  netProfitPercent: number;
  confidence: number;
  reasoning: string[];
}

export class YieldOptimizerNode implements Node {
  id: string;
  label: string;
  type = "yieldOptimizer";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {
    decision: null,
    action: "HOLD",
    shouldRebalance: false,
  };
  walletConfig: WalletConfig | undefined;

  private currentProtocol: string;
  private depositAmount: string;
  private minProfitThreshold: number;
  private gasPrice: string;
  private projectionMonths: number;

  constructor(
    id: string,
    label: string,
    config: {
      currentProtocol?: string;
      depositAmount?: string;
      minProfitThreshold?: number;
      gasPrice?: string;
      projectionMonths?: number;
    },
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.currentProtocol = config.currentProtocol || "aave-v3";
    this.depositAmount = config.depositAmount || "1000";
    this.minProfitThreshold = config.minProfitThreshold || 0.5;
    this.gasPrice = config.gasPrice || "30";
    this.projectionMonths = config.projectionMonths || 12;
    this.walletConfig = walletConfig;
  }

  async execute(): Promise<void> {
    console.log(`\n🤖 [Yield Optimizer] Analyzing rebalancing opportunities...`);

    const reasoning: string[] = [];
    
    // Get APY data from inputs (from APYMonitorNode)
    const apyData: APYData[] = this.inputs.apyData || [];
    const inputBestAPY = this.inputs.bestAPY || 0;
    
    if (apyData.length === 0) {
      reasoning.push("❌ No APY data available - cannot optimize");
      console.log(`⚠️ No APY data provided`);
      this.outputs = this.createHoldDecision(reasoning);
      return;
    }

    const depositAmountNum = parseFloat(this.depositAmount);
    reasoning.push(`📊 Analyzing ${apyData.length} protocols for $${depositAmountNum.toLocaleString()} deposit`);
    console.log(`📊 Deposit amount: $${depositAmountNum.toLocaleString()}`);

    // Find current protocol APY
    const currentAPYData = apyData.find(d => 
      d.protocol.toLowerCase().includes(this.currentProtocol.toLowerCase()) ||
      d.pool?.toLowerCase().includes(this.currentProtocol.toLowerCase())
    );
    const currentAPY = currentAPYData?.supplyAPY || apyData[apyData.length - 1]?.supplyAPY || 0;
    const actualCurrentProtocol = currentAPYData?.protocol || this.currentProtocol;

    reasoning.push(`📍 Current position: ${actualCurrentProtocol} at ${currentAPY.toFixed(2)}% APY`);
    console.log(`📍 Current: ${actualCurrentProtocol} @ ${currentAPY.toFixed(2)}% APY`);

    // Find best alternative (excluding current)
    const alternatives = apyData.filter(d => 
      !d.protocol.toLowerCase().includes(this.currentProtocol.toLowerCase())
    );
    const bestAlternative = alternatives[0];

    if (!bestAlternative) {
      reasoning.push("❌ No alternative protocols available");
      this.outputs = this.createHoldDecision(reasoning);
      return;
    }

    const bestAPY = bestAlternative.supplyAPY;
    const apyDifference = bestAPY - currentAPY;

    reasoning.push(`🎯 Best alternative: ${bestAlternative.protocol} at ${bestAPY.toFixed(2)}% APY`);
    reasoning.push(`📈 APY improvement: +${apyDifference.toFixed(2)}%`);
    console.log(`🎯 Best: ${bestAlternative.protocol} @ ${bestAPY.toFixed(2)}% APY (+${apyDifference.toFixed(2)}%)`);

    // Calculate potential profit over projection period
    const annualGainPercent = apyDifference;
    const projectedGainPercent = (annualGainPercent / 12) * this.projectionMonths;
    const projectedGainAmount = (depositAmountNum * projectedGainPercent) / 100;

    reasoning.push(`💰 Projected ${this.projectionMonths}mo gain: $${projectedGainAmount.toFixed(2)} (+${projectedGainPercent.toFixed(2)}%)`);

    // Estimate gas costs (withdraw + approve + deposit = ~3 transactions)
    const estimatedGasUnits = 450000;
    const gasPriceWei = ethers.utils.parseUnits(this.gasPrice, "gwei");
    const gasCostWei = gasPriceWei.mul(estimatedGasUnits);
    const gasCostEth = parseFloat(ethers.utils.formatEther(gasCostWei));
    const gasCostUSD = gasCostEth * 2000;

    reasoning.push(`⛽ Estimated gas: ~$${gasCostUSD.toFixed(2)} (${gasCostEth.toFixed(4)} ETH)`);
    console.log(`⛽ Gas estimate: ~$${gasCostUSD.toFixed(2)}`);

    // Calculate net profit
    const netProfit = projectedGainAmount - gasCostUSD;
    const netProfitPercent = (netProfit / depositAmountNum) * 100;

    reasoning.push(`📊 Net profit: $${netProfit.toFixed(2)} (${netProfitPercent.toFixed(2)}%)`);

    // Decision logic
    let decision: RebalanceDecision;

    if (apyDifference < 0.5) {
      reasoning.push("🔴 APY difference < 0.5% - not worth the complexity");
      decision = this.createDecision("HOLD", reasoning, {
        fromProtocol: actualCurrentProtocol,
        toProtocol: bestAlternative.protocol,
        confidence: 85,
      });
      console.log(`\n🔄 Decision: HOLD - APY difference too small`);

    } else if (netProfit < 0) {
      reasoning.push("🔴 Gas costs exceed potential profit");
      decision = this.createDecision("HOLD", reasoning, {
        fromProtocol: actualCurrentProtocol,
        toProtocol: bestAlternative.protocol,
        confidence: 90,
      });
      console.log(`\n🔄 Decision: HOLD - Gas costs too high`);

    } else if (netProfitPercent < this.minProfitThreshold) {
      reasoning.push(`🟡 Net profit ${netProfitPercent.toFixed(2)}% below ${this.minProfitThreshold}% threshold`);
      decision = this.createDecision("WAIT", reasoning, {
        fromProtocol: actualCurrentProtocol,
        toProtocol: bestAlternative.protocol,
        confidence: 75,
      });
      console.log(`\n⏳ Decision: WAIT - Profit below threshold`);

    } else {
      // REBALANCE!
      reasoning.push(`🟢 Rebalancing profitable: +${netProfitPercent.toFixed(2)}% net gain`);
      reasoning.push(`🟢 Recommended: Move from ${actualCurrentProtocol} → ${bestAlternative.protocol}`);
      
      const confidence = Math.min(95, 60 + apyDifference * 8 + netProfitPercent * 3);
      
      decision = {
        action: "REBALANCE",
        shouldRebalance: true,
        fromProtocol: actualCurrentProtocol,
        toProtocol: bestAlternative.protocol,
        expectedGainPercent: projectedGainPercent,
        expectedGainAmount: projectedGainAmount.toFixed(2),
        gasCostEstimate: gasCostUSD.toFixed(2),
        netProfit: netProfit.toFixed(2),
        netProfitPercent,
        confidence,
        reasoning,
      };

      console.log(`\n🚀 Decision: REBALANCE to ${bestAlternative.protocol}`);
      console.log(`💰 Expected net profit: +$${netProfit.toFixed(2)} (+${netProfitPercent.toFixed(2)}%)`);
      console.log(`🎯 Confidence: ${confidence.toFixed(0)}%`);
    }

    // Log reasoning chain
    console.log(`\n📝 AI Reasoning Chain:`);
    reasoning.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));

    // Set outputs
    this.outputs = {
      ...decision,
      currentProtocol: actualCurrentProtocol,
      currentAPY,
      bestProtocol: bestAlternative.protocol,
      bestAPY,
      apyDifference,
      depositAmount: this.depositAmount,
      projectedGainAmount: projectedGainAmount.toFixed(2),
      gasCostUSD: gasCostUSD.toFixed(2),
      timestamp: Date.now(),
    };
  }

  private createHoldDecision(reasoning: string[]): RebalanceDecision {
    return {
      action: "HOLD",
      shouldRebalance: false,
      fromProtocol: null,
      toProtocol: null,
      expectedGainPercent: 0,
      expectedGainAmount: "0",
      gasCostEstimate: "0",
      netProfit: "0",
      netProfitPercent: 0,
      confidence: 80,
      reasoning,
    };
  }

  private createDecision(
    action: "HOLD" | "WAIT",
    reasoning: string[],
    extra: { fromProtocol: string; toProtocol: string; confidence: number }
  ): RebalanceDecision {
    return {
      action,
      shouldRebalance: false,
      fromProtocol: extra.fromProtocol,
      toProtocol: extra.toProtocol,
      expectedGainPercent: 0,
      expectedGainAmount: "0",
      gasCostEstimate: "0",
      netProfit: "0",
      netProfitPercent: 0,
      confidence: extra.confidence,
      reasoning,
    };
  }
}
