import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

/**
 * StopLossNode - Monitors positions and triggers exit on stop-loss/take-profit
 * Continuously checks price against configured thresholds
 */
export interface PositionConfig {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionType: "long" | "short";
  positionSize: string;
  trailingStop?: boolean;
  trailingPercent?: number;
}

export class StopLossNode implements Node {
  id: string;
  label: string;
  type = "stopLoss";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {};
  walletConfig: WalletConfig | undefined;

  position: PositionConfig;
  highestPrice: number = 0;
  lowestPrice: number = Infinity;

  constructor(
    id: string,
    label: string,
    position: PositionConfig,
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.position = position;
    this.walletConfig = walletConfig;
    this.highestPrice = position.entryPrice;
    this.lowestPrice = position.entryPrice;
  }

  async execute(): Promise<void> {
    const currentPrice = this.inputs.price || this.inputs.currentPrice;

    if (!currentPrice) {
      console.error("❌ [StopLoss] No price data available");
      this.outputs.action = "hold";
      return;
    }

    console.log(`\n🛡️ [StopLoss] Monitoring ${this.position.symbol}`);
    console.log(`   Current Price: $${currentPrice}`);
    console.log(`   Entry Price: $${this.position.entryPrice}`);
    console.log(`   Stop Loss: $${this.position.stopLossPrice}`);
    console.log(`   Take Profit: $${this.position.takeProfitPrice}`);
    console.log(`   Position: ${this.position.positionType.toUpperCase()}`);

    // Update trailing stop if enabled
    if (this.position.trailingStop && this.position.trailingPercent) {
      this.updateTrailingStop(currentPrice);
    }

    // Calculate P&L
    const pnlPercent = this.position.positionType === "long"
      ? ((currentPrice - this.position.entryPrice) / this.position.entryPrice) * 100
      : ((this.position.entryPrice - currentPrice) / this.position.entryPrice) * 100;

    console.log(`   Current P&L: ${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`);

    // Check stop loss
    const hitStopLoss = this.position.positionType === "long"
      ? currentPrice <= this.position.stopLossPrice
      : currentPrice >= this.position.stopLossPrice;

    // Check take profit
    const hitTakeProfit = this.position.positionType === "long"
      ? currentPrice >= this.position.takeProfitPrice
      : currentPrice <= this.position.takeProfitPrice;

    if (hitStopLoss) {
      console.log(`\n🔴 [StopLoss] STOP LOSS TRIGGERED!`);
      console.log(`   Closing position at $${currentPrice}`);
      console.log(`   Loss: ${pnlPercent.toFixed(2)}%`);
      
      this.outputs.action = "close";
      this.outputs.reason = "stop_loss";
      this.outputs.exitPrice = currentPrice;
      this.outputs.pnlPercent = pnlPercent;
      this.outputs.shouldClose = true;
    } else if (hitTakeProfit) {
      console.log(`\n🟢 [StopLoss] TAKE PROFIT TRIGGERED!`);
      console.log(`   Closing position at $${currentPrice}`);
      console.log(`   Profit: +${pnlPercent.toFixed(2)}%`);
      
      this.outputs.action = "close";
      this.outputs.reason = "take_profit";
      this.outputs.exitPrice = currentPrice;
      this.outputs.pnlPercent = pnlPercent;
      this.outputs.shouldClose = true;
    } else {
      console.log(`   Status: Position active, no exit trigger`);
      
      this.outputs.action = "hold";
      this.outputs.reason = "within_range";
      this.outputs.currentPrice = currentPrice;
      this.outputs.pnlPercent = pnlPercent;
      this.outputs.shouldClose = false;
    }

    // Always output position info
    this.outputs.position = this.position;
    this.outputs.highestPrice = this.highestPrice;
    this.outputs.lowestPrice = this.lowestPrice;
  }

  private updateTrailingStop(currentPrice: number): void {
    if (this.position.positionType === "long") {
      // For long positions, trail stop up as price increases
      if (currentPrice > this.highestPrice) {
        this.highestPrice = currentPrice;
        const newStopLoss = currentPrice * (1 - (this.position.trailingPercent! / 100));
        
        if (newStopLoss > this.position.stopLossPrice) {
          console.log(`   📈 Trailing stop updated: $${this.position.stopLossPrice.toFixed(2)} → $${newStopLoss.toFixed(2)}`);
          this.position.stopLossPrice = newStopLoss;
        }
      }
    } else {
      // For short positions, trail stop down as price decreases
      if (currentPrice < this.lowestPrice) {
        this.lowestPrice = currentPrice;
        const newStopLoss = currentPrice * (1 + (this.position.trailingPercent! / 100));
        
        if (newStopLoss < this.position.stopLossPrice) {
          console.log(`   📉 Trailing stop updated: $${this.position.stopLossPrice.toFixed(2)} → $${newStopLoss.toFixed(2)}`);
          this.position.stopLossPrice = newStopLoss;
        }
      }
    }
  }
}
