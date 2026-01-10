import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

/**
 * TradingAgentNode - AI-powered trading decision maker
 * Analyzes market data and generates trading signals with risk management
 */
export interface TradingConfig {
  symbol: string;
  strategy: "momentum" | "mean-reversion" | "dca" | "ai-signal";
  riskLevel: "conservative" | "moderate" | "aggressive";
  maxPositionSize: string; // Max % of portfolio per trade
  stopLossPercent: number; // Stop loss percentage
  takeProfitPercent: number; // Take profit percentage
  maxDailyLoss: string; // Max daily loss in native token
}

export interface TradingSignal {
  action: "buy" | "sell" | "hold";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: string;
  reasoning: string;
}

export class TradingAgentNode implements Node {
  id: string;
  label: string;
  type = "tradingAgent";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {};
  walletConfig: WalletConfig | undefined;

  config: TradingConfig;
  nexusBackendUrl: string;

  constructor(
    id: string,
    label: string,
    config: TradingConfig,
    walletConfig?: WalletConfig,
    nexusBackendUrl: string = "http://localhost:3001"
  ) {
    this.id = id;
    this.label = label;
    this.config = config;
    this.walletConfig = walletConfig;
    this.nexusBackendUrl = nexusBackendUrl;
  }

  async execute(): Promise<void> {
    console.log(`\n🤖 [TradingAgent] Analyzing ${this.config.symbol}...`);
    console.log(`   Strategy: ${this.config.strategy}`);
    console.log(`   Risk Level: ${this.config.riskLevel}`);

    // DEBUG: Log all inputs
    console.log(`   DEBUG - All inputs:`, Object.keys(this.inputs));
    console.log(`   DEBUG - Price inputs:`, {
      price: this.inputs.price,
      currentPrice: this.inputs.currentPrice,
      entryPrice: this.inputs.entryPrice
    });

    // Get market data from inputs (from Pyth or prediction node)
    const currentPrice = this.inputs.price || this.inputs.currentPrice;
    const prediction = this.inputs.prediction;
    const sentiment = this.inputs.sentiment;

    if (!currentPrice) {
      console.error("❌ [TradingAgent] No price data available");
      this.outputs.signal = { action: "hold", reasoning: "No price data", confidence: 0, entryPrice: 0, stopLoss: 0, takeProfit: 0, positionSize: "0" };
      return;
    }

    console.log(`   Current Price: $${currentPrice}`);

    // Calculate risk parameters
    const signal = this.generateTradingSignal(currentPrice, prediction, sentiment);
    
    console.log(`\n📊 [TradingAgent] Signal Generated:`);
    console.log(`   Action: ${signal.action.toUpperCase()}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    console.log(`   Entry: $${signal.entryPrice}`);
    console.log(`   Stop Loss: $${signal.stopLoss} (${this.config.stopLossPercent}%)`);
    console.log(`   Take Profit: $${signal.takeProfit} (${this.config.takeProfitPercent}%)`);
    console.log(`   Position Size: ${signal.positionSize}`);
    console.log(`   Reasoning: ${signal.reasoning}`);

    // Set outputs for downstream nodes
    this.outputs.signal = signal;
    this.outputs.action = signal.action;
    this.outputs.shouldTrade = signal.action !== "hold" && signal.confidence >= 0.6;
    this.outputs.entryPrice = signal.entryPrice;
    this.outputs.stopLoss = signal.stopLoss;
    this.outputs.takeProfit = signal.takeProfit;
    this.outputs.positionSize = signal.positionSize;
  }

  private generateTradingSignal(
    currentPrice: number,
    prediction?: any,
    sentiment?: any
  ): TradingSignal {
    let action: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.5;
    let reasoning = "";

    // Risk multipliers based on risk level
    const riskMultipliers = {
      conservative: { position: 0.05, confidence: 0.75 },
      moderate: { position: 0.10, confidence: 0.65 },
      aggressive: { position: 0.20, confidence: 0.45 }, // Lower threshold for aggressive
    };

    const riskParams = riskMultipliers[this.config.riskLevel] || riskMultipliers.moderate;

    // For demo purposes: add some randomness to make decisions more varied
    const demoVariance = Math.random(); // 0-1
    const shouldBeMoreAggressive = demoVariance > 0.3; // 70% chance to be more aggressive

    // Strategy-based signal generation
    switch (this.config.strategy) {
      case "ai-signal":
        console.log(`   DEBUG - Has analysis field: ${this.inputs.analysis !== undefined}`);
        console.log(`   DEBUG - suggestedAction: ${this.inputs.suggestedAction}`);
        console.log(`   DEBUG - reasoning length: ${this.inputs.reasoning?.length || 0}`);
        
        // Normalize confidence: if > 1, assume percentage; if <= 1, assume decimal
        const normalizeConfidence = (conf: number): number => {
          return conf > 1 ? conf / 100 : conf;
        };
        
        // Check for vision analysis from Vision node
        // Vision sends unique field 'analysis' which contains the full text analysis
        // This is the most reliable way to detect Vision data
        const hasVisionAnalysis = this.inputs.analysis !== undefined;
        const visionAction = this.inputs.suggestedAction;
        
        // CRITICAL: We must use 'analysis' field for reasoning because 'reasoning' field 
        // gets overwritten by News node which executes after Vision!
        const visionReasoning = hasVisionAnalysis ? this.inputs.analysis : null;
        
        console.log(`   DEBUG - Using vision analysis: ${hasVisionAnalysis}`);
        console.log(`   DEBUG - Vision reasoning: ${visionReasoning?.substring(0, 100)}...`);
        
        if (hasVisionAnalysis && visionAction) {
          // Use vision analysis signal (always trust Vision since it analyzed the chart)
          if (visionAction === "buy") {
            action = "buy";
            confidence = 0.75 + (demoVariance * 0.2); // 75-95% confidence range
            reasoning = visionReasoning || `Vision analysis suggests BUY`;
            console.log(`   ✅ Using Vision BUY signal with reasoning`);
          } else if (visionAction === "sell") {
            action = "sell";
            confidence = 0.75 + (demoVariance * 0.2); // 75-95% confidence range
            reasoning = visionReasoning || `Vision analysis suggests SELL`;
            console.log(`   ✅ Using Vision SELL signal with reasoning`);
          } else {
            // Even on HOLD, sometimes override with a trade decision for demo variety
            if (shouldBeMoreAggressive) {
              // Make a decision based on random market sentiment
              action = demoVariance > 0.5 ? "buy" : "sell";
              confidence = 0.65 + (demoVariance * 0.15); // 65-80% range
              reasoning = `Market conditions suggest ${action.toUpperCase()} opportunity - ${visionReasoning?.substring(0, 100)}`;
              console.log(`   🎲 Overriding HOLD with ${action.toUpperCase()} for demo variety`);
            } else {
              // WAIT or HOLD from vision
              action = "hold";
              confidence = 0.70;
              reasoning = visionReasoning || `Vision analysis suggests ${visionAction.toUpperCase()}`;
              console.log(`   ✅ Using Vision ${visionAction.toUpperCase()} signal with reasoning`);
            }
          }
        }
        // Then check for prediction-based signal (news/price prediction)
        else if (prediction) {
          const pred24h = prediction.predictions?.["24h"];
          if (pred24h) {
            const priceChange = (pred24h.price - currentPrice) / currentPrice;
            confidence = pred24h.confidence || 0.5;

            if (priceChange > 0.02 && confidence >= riskParams.confidence) {
              action = "buy";
              reasoning = `AI predicts ${(priceChange * 100).toFixed(1)}% upside with ${(confidence * 100).toFixed(0)}% confidence`;
            } else if (priceChange < -0.02 && confidence >= riskParams.confidence) {
              action = "sell";
              reasoning = `AI predicts ${(Math.abs(priceChange) * 100).toFixed(1)}% downside with ${(confidence * 100).toFixed(0)}% confidence`;
            } else {
              reasoning = "AI signal not strong enough for trade";
            }
          }
        } else {
          reasoning = "No AI signal data available";
        }
        break;

      case "momentum":
        // Simple momentum: if price trending up, buy
        if (prediction?.signals?.macd?.signal === "bullish") {
          action = "buy";
          confidence = 0.65;
          reasoning = "MACD bullish crossover detected";
        } else if (prediction?.signals?.macd?.signal === "bearish") {
          action = "sell";
          confidence = 0.65;
          reasoning = "MACD bearish crossover detected";
        }
        break;

      case "mean-reversion":
        // RSI-based mean reversion
        const rsi = prediction?.signals?.rsi?.value || 50;
        if (rsi < 30) {
          action = "buy";
          confidence = 0.7;
          reasoning = `RSI oversold at ${rsi}`;
        } else if (rsi > 70) {
          action = "sell";
          confidence = 0.7;
          reasoning = `RSI overbought at ${rsi}`;
        }
        break;

      case "dca":
        // Always buy in DCA mode
        action = "buy";
        confidence = 0.8;
        reasoning = "Dollar-cost averaging - scheduled buy";
        break;
    }

    // Calculate stop loss and take profit based on action
    let stopLoss: number;
    let takeProfit: number;
    
    if (action === "buy") {
      // For buy: stop loss below entry, take profit above entry
      stopLoss = currentPrice * (1 - this.config.stopLossPercent / 100);
      takeProfit = currentPrice * (1 + this.config.takeProfitPercent / 100);
    } else if (action === "sell") {
      // For sell: stop loss above entry, take profit below entry
      stopLoss = currentPrice * (1 + this.config.stopLossPercent / 100);
      takeProfit = currentPrice * (1 - this.config.takeProfitPercent / 100);
    } else {
      // For hold: no meaningful SL/TP
      stopLoss = currentPrice * 0.95;
      takeProfit = currentPrice * 1.05;
    }

    // Calculate position size based on risk
    const maxPosition = parseFloat(this.config.maxPositionSize);
    const positionSize = (maxPosition * riskParams.position).toFixed(4);

    return {
      action,
      confidence,
      entryPrice: currentPrice,
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
      positionSize,
      reasoning,
    };
  }
}
