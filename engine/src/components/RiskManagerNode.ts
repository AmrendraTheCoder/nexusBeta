import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

/**
 * RiskManagerNode - Portfolio-level risk management
 * Enforces position limits, daily loss limits, and portfolio allocation rules
 */
export interface RiskConfig {
  maxPortfolioRisk: number; // Max % of portfolio at risk
  maxSinglePositionSize: number; // Max % per single position
  maxDailyLoss: number; // Max daily loss in %
  maxOpenPositions: number; // Max concurrent positions
  minBalanceReserve: number; // Min % to keep as reserve
  correlationLimit: number; // Max correlation between positions
}

export interface PortfolioState {
  totalBalance: string;
  availableBalance: string;
  openPositions: number;
  dailyPnL: number;
  totalExposure: number;
}

export class RiskManagerNode implements Node {
  id: string;
  label: string;
  type = "riskManager";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {};
  walletConfig: WalletConfig | undefined;

  config: RiskConfig;
  portfolio: PortfolioState;
  dailyTrades: { timestamp: number; pnl: number }[] = [];

  constructor(
    id: string,
    label: string,
    config: RiskConfig,
    portfolio: PortfolioState,
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.config = config;
    this.portfolio = portfolio;
    this.walletConfig = walletConfig;
  }

  async execute(): Promise<void> {
    console.log(`\n⚖️ [RiskManager] Evaluating trade request...`);

    // Get proposed trade from inputs
    const proposedTrade = this.inputs.signal || this.inputs.trade;
    const action = proposedTrade?.action || this.inputs.action;
    const positionSize = parseFloat(proposedTrade?.positionSize || this.inputs.positionSize || "0");

    if (!action || action === "hold") {
      console.log(`   No trade proposed, skipping risk check`);
      this.outputs.approved = false;
      this.outputs.reason = "no_trade_proposed";
      return;
    }

    console.log(`   Proposed Action: ${action.toUpperCase()}`);
    console.log(`   Position Size: ${positionSize}`);

    // Run risk checks
    const checks = this.runRiskChecks(positionSize);
    
    console.log(`\n📋 Risk Check Results:`);
    checks.forEach(check => {
      const icon = check.passed ? "✅" : "❌";
      console.log(`   ${icon} ${check.name}: ${check.message}`);
    });

    const allPassed = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);

    if (allPassed) {
      console.log(`\n✅ [RiskManager] Trade APPROVED`);
      this.outputs.approved = true;
      this.outputs.adjustedSize = positionSize;
      this.outputs.reason = "all_checks_passed";
    } else {
      console.log(`\n❌ [RiskManager] Trade REJECTED`);
      console.log(`   Failed checks: ${failedChecks.map(c => c.name).join(", ")}`);
      
      // Try to adjust position size if only size-related checks failed
      const sizeAdjustment = this.calculateSafePositionSize();
      
      if (sizeAdjustment > 0 && sizeAdjustment < positionSize) {
        console.log(`   💡 Suggested adjusted size: ${sizeAdjustment.toFixed(4)}`);
        this.outputs.approved = true;
        this.outputs.adjustedSize = sizeAdjustment;
        this.outputs.reason = "size_adjusted";
        this.outputs.originalSize = positionSize;
      } else {
        this.outputs.approved = false;
        this.outputs.reason = failedChecks[0]?.name || "risk_limit_exceeded";
      }
    }

    this.outputs.checks = checks;
    this.outputs.portfolio = this.portfolio;
  }

  private runRiskChecks(positionSize: number): { name: string; passed: boolean; message: string }[] {
    const checks: { name: string; passed: boolean; message: string }[] = [];
    const totalBalance = parseFloat(this.portfolio.totalBalance);
    const availableBalance = parseFloat(this.portfolio.availableBalance);

    // Check 1: Daily loss limit
    const dailyLossPercent = (this.portfolio.dailyPnL / totalBalance) * 100;
    checks.push({
      name: "daily_loss_limit",
      passed: dailyLossPercent > -this.config.maxDailyLoss,
      message: dailyLossPercent > -this.config.maxDailyLoss
        ? `Daily P&L: ${dailyLossPercent.toFixed(2)}% (limit: -${this.config.maxDailyLoss}%)`
        : `Daily loss limit exceeded: ${dailyLossPercent.toFixed(2)}%`,
    });

    // Check 2: Max open positions
    checks.push({
      name: "max_positions",
      passed: this.portfolio.openPositions < this.config.maxOpenPositions,
      message: this.portfolio.openPositions < this.config.maxOpenPositions
        ? `Open positions: ${this.portfolio.openPositions}/${this.config.maxOpenPositions}`
        : `Max positions reached: ${this.portfolio.openPositions}`,
    });

    // Check 3: Single position size limit
    const positionPercent = (positionSize / totalBalance) * 100;
    checks.push({
      name: "position_size_limit",
      passed: positionPercent <= this.config.maxSinglePositionSize,
      message: positionPercent <= this.config.maxSinglePositionSize
        ? `Position size: ${positionPercent.toFixed(2)}% (limit: ${this.config.maxSinglePositionSize}%)`
        : `Position too large: ${positionPercent.toFixed(2)}% > ${this.config.maxSinglePositionSize}%`,
    });

    // Check 4: Portfolio exposure limit
    const newExposure = this.portfolio.totalExposure + positionSize;
    const exposurePercent = (newExposure / totalBalance) * 100;
    checks.push({
      name: "portfolio_exposure",
      passed: exposurePercent <= this.config.maxPortfolioRisk,
      message: exposurePercent <= this.config.maxPortfolioRisk
        ? `Total exposure: ${exposurePercent.toFixed(2)}% (limit: ${this.config.maxPortfolioRisk}%)`
        : `Exposure limit exceeded: ${exposurePercent.toFixed(2)}%`,
    });

    // Check 5: Minimum reserve
    const reserveAfterTrade = availableBalance - positionSize;
    const reservePercent = (reserveAfterTrade / totalBalance) * 100;
    checks.push({
      name: "minimum_reserve",
      passed: reservePercent >= this.config.minBalanceReserve,
      message: reservePercent >= this.config.minBalanceReserve
        ? `Reserve after trade: ${reservePercent.toFixed(2)}% (min: ${this.config.minBalanceReserve}%)`
        : `Insufficient reserve: ${reservePercent.toFixed(2)}%`,
    });

    // Check 6: Sufficient balance
    checks.push({
      name: "sufficient_balance",
      passed: positionSize <= availableBalance,
      message: positionSize <= availableBalance
        ? `Available: ${availableBalance} (need: ${positionSize})`
        : `Insufficient balance: ${availableBalance} < ${positionSize}`,
    });

    return checks;
  }

  private calculateSafePositionSize(): number {
    const totalBalance = parseFloat(this.portfolio.totalBalance);
    const availableBalance = parseFloat(this.portfolio.availableBalance);

    // Calculate max based on each constraint
    const maxByPositionLimit = totalBalance * (this.config.maxSinglePositionSize / 100);
    const maxByExposure = totalBalance * (this.config.maxPortfolioRisk / 100) - this.portfolio.totalExposure;
    const maxByReserve = availableBalance - (totalBalance * this.config.minBalanceReserve / 100);
    const maxByBalance = availableBalance;

    // Return the minimum of all constraints
    return Math.max(0, Math.min(maxByPositionLimit, maxByExposure, maxByReserve, maxByBalance));
  }

  // Update daily P&L tracking
  recordTrade(pnl: number): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Remove trades older than 24 hours
    this.dailyTrades = this.dailyTrades.filter(t => t.timestamp > oneDayAgo);
    
    // Add new trade
    this.dailyTrades.push({ timestamp: now, pnl });
    
    // Update daily P&L
    this.portfolio.dailyPnL = this.dailyTrades.reduce((sum, t) => sum + t.pnl, 0);
  }
}
