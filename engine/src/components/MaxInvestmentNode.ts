import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

interface MaxInvestmentConfig {
  maxAmountPerTrade: string;
  maxTotalExposure: string;
  currency: string;
  enforceLimit: boolean;
}

/**
 * MaxInvestmentNode - Trust & Safety node that enforces maximum investment limits
 * REQUIRED for AI Trading workflows
 */
export class MaxInvestmentNode implements Node {
  id: string;
  label: string;
  type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  config: MaxInvestmentConfig;
  walletConfig: WalletConfig | undefined;

  constructor(
    id: string,
    label: string,
    config: MaxInvestmentConfig,
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.type = "maxInvestment";
    this.config = config;
    this.walletConfig = walletConfig;
    this.inputs = {};
    this.outputs = {
      approved: false,
      adjustedAmount: "0",
      reason: "",
    };
  }

  async execute(): Promise<Record<string, any>> {
    console.log(`\n🛡️ [MaxInvestment] Checking investment limits...`);
    console.log(`   Max per trade: ${this.config.maxAmountPerTrade} ${this.config.currency}`);
    console.log(`   Max total exposure: ${this.config.maxTotalExposure} ${this.config.currency}`);

    const inputData = this.inputs;
    const requestedAmount = parseFloat(inputData.amount || inputData.positionSize || "0");
    const currentExposure = parseFloat(inputData.currentExposure || "0");
    const maxPerTrade = parseFloat(this.config.maxAmountPerTrade);
    const maxExposure = parseFloat(this.config.maxTotalExposure);

    let approved = true;
    let adjustedAmount = requestedAmount.toString();
    let reason = "Trade approved within limits";

    // Check per-trade limit
    if (requestedAmount > maxPerTrade) {
      if (this.config.enforceLimit) {
        adjustedAmount = maxPerTrade.toString();
        reason = `Amount reduced from ${requestedAmount} to ${maxPerTrade} (max per trade limit)`;
        console.log(`   ⚠️ ${reason}`);
      } else {
        approved = false;
        reason = `Requested amount ${requestedAmount} exceeds max per trade ${maxPerTrade}`;
        console.log(`   ❌ ${reason}`);
      }
    }

    // Check total exposure limit
    const newExposure = currentExposure + parseFloat(adjustedAmount);
    if (newExposure > maxExposure) {
      const allowedAmount = Math.max(0, maxExposure - currentExposure);
      if (this.config.enforceLimit && allowedAmount > 0) {
        adjustedAmount = allowedAmount.toString();
        reason = `Amount reduced to ${allowedAmount} to stay within total exposure limit`;
        console.log(`   ⚠️ ${reason}`);
      } else {
        approved = false;
        reason = `Total exposure ${newExposure} would exceed max ${maxExposure}`;
        console.log(`   ❌ ${reason}`);
      }
    }

    if (approved) {
      console.log(`   ✅ Investment approved: ${adjustedAmount} ${this.config.currency}`);
    }

    this.outputs = {
      approved,
      adjustedAmount,
      reason,
      maxPerTrade: this.config.maxAmountPerTrade,
      maxExposure: this.config.maxTotalExposure,
      currentExposure: currentExposure.toString(),
    };

    return this.outputs;
  }
}
