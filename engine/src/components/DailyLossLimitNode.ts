import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

interface DailyLossConfig {
  maxDailyLossPercent: number;
  maxDailyLossAmount: string;
  pauseOnLimit: boolean;
  resetTime: string;
  notifyOnWarning: boolean;
}

/**
 * DailyLossLimitNode - Trust & Safety node that enforces daily loss limits
 * REQUIRED for AI Trading workflows
 */
export class DailyLossLimitNode implements Node {
  id: string;
  label: string;
  type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  config: DailyLossConfig;
  walletConfig: WalletConfig | undefined;

  constructor(
    id: string,
    label: string,
    config: DailyLossConfig,
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.type = "dailyLossLimit";
    this.config = config;
    this.walletConfig = walletConfig;
    this.inputs = {};
    this.outputs = {
      canTrade: true,
      remainingBudget: "0",
      dailyLoss: 0,
      alert: "",
    };
  }

  async execute(): Promise<Record<string, any>> {
    console.log(`\n🛡️ [DailyLossLimit] Checking daily loss limits...`);
    console.log(`   Max daily loss: ${this.config.maxDailyLossPercent}% or ${this.config.maxDailyLossAmount}`);

    const inputData = this.inputs;
    const currentPnL = parseFloat(inputData.currentPnL || inputData.dailyPnL || "0");
    const portfolioValue = parseFloat(inputData.portfolioValue || inputData.totalBalance || "1");
    const maxLossPercent = this.config.maxDailyLossPercent;
    const maxLossAmount = parseFloat(this.config.maxDailyLossAmount);

    // Calculate current loss percentage
    const currentLossPercent = portfolioValue > 0 ? (Math.abs(currentPnL) / portfolioValue) * 100 : 0;
    const currentLossAmount = Math.abs(currentPnL);

    let canTrade = true;
    let alert = "";

    // Check percentage limit
    if (currentPnL < 0 && currentLossPercent >= maxLossPercent) {
      canTrade = false;
      alert = `Daily loss limit reached: ${currentLossPercent.toFixed(2)}% (max: ${maxLossPercent}%)`;
      console.log(`   ❌ ${alert}`);
    }

    // Check absolute amount limit
    if (currentPnL < 0 && currentLossAmount >= maxLossAmount) {
      canTrade = false;
      alert = `Daily loss limit reached: ${currentLossAmount.toFixed(4)} (max: ${maxLossAmount})`;
      console.log(`   ❌ ${alert}`);
    }

    // Warning at 80% of limit
    if (canTrade && this.config.notifyOnWarning) {
      const warningThreshold = 0.8;
      if (currentLossPercent >= maxLossPercent * warningThreshold) {
        alert = `Warning: Approaching daily loss limit (${currentLossPercent.toFixed(2)}% of ${maxLossPercent}%)`;
        console.log(`   ⚠️ ${alert}`);
      }
    }

    // Calculate remaining budget
    const remainingPercent = Math.max(0, maxLossPercent - currentLossPercent);
    const remainingAmount = Math.max(0, maxLossAmount - currentLossAmount);
    const remainingBudget = Math.min(
      (remainingPercent / 100) * portfolioValue,
      remainingAmount
    );

    if (canTrade) {
      console.log(`   ✅ Trading allowed. Remaining budget: ${remainingBudget.toFixed(4)}`);
    } else if (this.config.pauseOnLimit) {
      console.log(`   🛑 Trading paused until ${this.config.resetTime} UTC`);
    }

    this.outputs = {
      canTrade,
      remainingBudget: remainingBudget.toString(),
      dailyLoss: currentPnL,
      dailyLossPercent: currentLossPercent,
      alert,
      resetTime: this.config.resetTime,
      isPaused: !canTrade && this.config.pauseOnLimit,
    };

    return this.outputs;
  }
}
