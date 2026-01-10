import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

/**
 * AIPredictionNode - Fetches AI predictions from paid API using NIP-1
 * Integrates with Nexus payment system for 402 API access
 */
export interface PredictionConfig {
  symbol: string;
  apiUrl: string;
  provider: string; // Provider wallet address for payment
  paymentAmount: string; // Amount in wei
  chainId: number;
  nexusBackendUrl: string;
}

export interface AIPrediction {
  symbol: string;
  currentPrice: number;
  predictions: {
    "24h": { price: number; confidence: number; direction: string };
    "7d"?: { price: number; confidence: number; direction: string };
    "30d"?: { price: number; confidence: number; direction: string };
  };
  signals: {
    rsi: { value: number; signal: string };
    macd: { value: number; signal: string };
    movingAverage: { value: number; signal: string };
  };
  sentiment?: string;
  generatedAt: string;
}

export class AIPredictionNode implements Node {
  id: string;
  label: string;
  type = "aiPrediction";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {};
  walletConfig: WalletConfig | undefined;

  config: PredictionConfig;
  userWallet: string;

  constructor(
    id: string,
    label: string,
    config: PredictionConfig,
    userWallet: string,
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.config = config;
    this.userWallet = userWallet;
    this.walletConfig = walletConfig;
  }

  async execute(): Promise<void> {
    console.log(`\n🔮 [AIPrediction] Fetching prediction for ${this.config.symbol}...`);
    console.log(`   API: ${this.config.apiUrl}`);
    console.log(`   Payment: ${this.config.paymentAmount} wei to ${this.config.provider}`);

    try {
      // Step 1: Execute payment through Nexus backend
      const paymentResult = await this.executePayment();
      
      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.message}`);
      }

      console.log(`   ✅ Payment successful: ${paymentResult.txHash}`);

      // Step 2: Fetch prediction with payment proof
      const prediction = await this.fetchPrediction(paymentResult.txHash || "");

      console.log(`\n📊 [AIPrediction] Prediction received:`);
      console.log(`   Current Price: $${prediction.currentPrice}`);
      console.log(`   24h Prediction: $${prediction.predictions["24h"].price} (${prediction.predictions["24h"].direction})`);
      console.log(`   Confidence: ${(prediction.predictions["24h"].confidence * 100).toFixed(1)}%`);
      console.log(`   RSI: ${prediction.signals.rsi.value} (${prediction.signals.rsi.signal})`);
      console.log(`   MACD: ${prediction.signals.macd.signal}`);

      // Set outputs
      this.outputs.prediction = prediction;
      this.outputs.currentPrice = prediction.currentPrice;
      this.outputs.price = prediction.currentPrice; // Alias for compatibility
      this.outputs.direction = prediction.predictions["24h"].direction;
      this.outputs.confidence = prediction.predictions["24h"].confidence;
      this.outputs.sentiment = this.deriveSentiment(prediction);
      this.outputs.signals = prediction.signals;
      this.outputs.paymentTxHash = paymentResult.txHash;
      this.outputs.success = true;

    } catch (error) {
      console.error(`❌ [AIPrediction] Error:`, error);
      
      this.outputs.success = false;
      this.outputs.error = error instanceof Error ? error.message : String(error);
      
      // Provide fallback data for workflow continuity
      this.outputs.prediction = null;
      this.outputs.sentiment = "neutral";
    }
  }

  private async executePayment(): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(`${this.config.nexusBackendUrl}/api/nexus/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: this.userWallet,
          provider: this.config.provider,
          amount: this.config.paymentAmount,
          chainId: this.config.chainId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Payment request failed",
      };
    }
  }

  private async fetchPrediction(paymentTxHash: string): Promise<AIPrediction> {
    const response = await fetch(this.config.apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": `${paymentTxHash}:${this.config.chainId}`,
      },
    });

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error("Payment required - payment may not have been verified");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  private deriveSentiment(prediction: AIPrediction): "bullish" | "bearish" | "neutral" {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // Check prediction direction
    if (prediction.predictions["24h"].direction === "up") bullishSignals++;
    else if (prediction.predictions["24h"].direction === "down") bearishSignals++;

    // Check RSI
    if (prediction.signals.rsi.value < 30) bullishSignals++; // Oversold = bullish
    else if (prediction.signals.rsi.value > 70) bearishSignals++; // Overbought = bearish

    // Check MACD
    if (prediction.signals.macd.signal === "bullish") bullishSignals++;
    else if (prediction.signals.macd.signal === "bearish") bearishSignals++;

    // Check MA
    if (prediction.signals.movingAverage.signal === "bullish") bullishSignals++;
    else if (prediction.signals.movingAverage.signal === "bearish") bearishSignals++;

    if (bullishSignals > bearishSignals + 1) return "bullish";
    if (bearishSignals > bullishSignals + 1) return "bearish";
    return "neutral";
  }
}
