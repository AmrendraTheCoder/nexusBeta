# 24/7 Automated AI Trading System

## Overview
This system enables continuous automated trading based on AI predictions, market analysis, and risk management.

## Key Features

### 🤖 Automated Trading
- **24/7 Market Monitoring**: Continuously checks market conditions
- **AI-Powered Decision Making**: Uses vision analysis and news sentiment
- **Auto Execution**: Automatically executes trades when conditions are met
- **Risk Management**: Built-in risk controls and position limits

### 🔄 Workflow Types

#### 1. **Once** (Manual/Analysis Only)
- Runs one time
- Good for testing and manual review
- Shows "HOLD" when conditions aren't met

#### 2. **Repeat** (24/7 Automated)
- Runs continuously at set intervals
- Automatically executes approved trades
- Configurable monitoring frequency (1min - 1hour)

## How to Use

### Setup Your 24/7 Bot

1. **Load the Automated Template**
   ```
   File: frontend/public/workflows/automated-trading-24-7.json
   ```

2. **Configure Workflow Settings**
   - **Type**: Set to `"repeat"` for 24/7 mode
   - **Interval**: Choose monitoring frequency
     - `60000` = 1 minute
     - `300000` = 5 minutes (recommended)
     - `900000` = 15 minutes
     - `3600000` = 1 hour

3. **Customize Trading Parameters**
   - Risk level: conservative/moderate/aggressive
   - Position size limits
   - Stop loss percentage
   - Take profit targets

### Starting the Bot

```javascript
// Frontend execution
executeWorkflow(
  nodes,
  edges,
  "24/7 AI Trading Bot",
  walletAddress,
  "repeat" // Important: Use "repeat" type
);
```

### API Usage

**Start 24/7 Workflow:**
```bash
POST /workflow
{
  "json_workflow": {
    "walletaddr": "0x...",
    "type": "repeat",
    "repeatInterval": 300000,  // 5 minutes
    "nodes": { ... },
    "edges": { ... }
  }
}
```

**Stop Workflow:**
```bash
POST /workflow/stop
{
  "walletaddr": "0x..."
}
```

**Check Status:**
```bash
GET /logs/:walletaddr
```

## Workflow Components

### Price Monitoring (`pyth-network`)
- Fetches real-time prices from Pyth oracles
- Updates every check interval

### AI Analysis (`visionAnalysis`)
- Analyzes chart patterns
- Provides bullish/bearish sentiment
- Suggests entry/exit points

### News Sentiment (`newsPrediction`)
- Aggregates news from multiple sources
- Calculates sentiment score
- Predicts market movement

### Trading Agent (`tradingAgent`)
- Combines all inputs
- Generates BUY/SELL/HOLD signals
- Calculates position sizes

### Risk Management (`riskManager`)
- Validates trade against risk parameters
- Prevents over-exposure
- Checks daily loss limits

### Investment Limiter (`maxInvestment`)
- Enforces per-trade limits
- Tracks total exposure
- Prevents excessive positions

### Condition Gate (`condition`)
- Only executes when `shouldTrade === true`
- Protects against false signals

### Trade Execution (`swap`)
- Executes approved trades automatically
- Uses 1inch DEX aggregator
- Includes slippage protection

## Safety Features

### Automatic Safeguards
- ✅ Multi-layer risk validation
- ✅ Position size limits
- ✅ Daily loss caps
- ✅ Maximum open positions
- ✅ Stop-loss protection

### Manual Controls
- 🛑 Emergency stop button
- ⏸️ Pause between intervals
- 📊 Real-time log monitoring
- 🔍 Trade history tracking

## Monitoring Your Bot

### Live Logs
The system provides real-time logs showing:
- Market analysis results
- Trading signals generated
- Risk validation outcomes
- Executed trades
- Errors or warnings

### Statistics Tracking
- Total market checks
- Trades executed
- Win/loss ratio
- Total profit/loss
- Last execution time

## Configuration Examples

### Conservative Bot (Low Risk)
```json
{
  "riskLevel": "conservative",
  "maxAmountPerTrade": "0.01",
  "maxTotalExposure": "0.05",
  "stopLossPercent": 3,
  "takeProfitPercent": 6,
  "repeatInterval": 900000  // 15 minutes
}
```

### Aggressive Bot (High Risk)
```json
{
  "riskLevel": "aggressive",
  "maxAmountPerTrade": "0.1",
  "maxTotalExposure": "0.5",
  "stopLossPercent": 8,
  "takeProfitPercent": 15,
  "repeatInterval": 60000  // 1 minute
}
```

## Important Notes

### ⚠️ Risk Disclaimer
- Automated trading carries significant risk
- Monitor your bot regularly
- Start with small amounts
- Test thoroughly in demo mode
- Never invest more than you can afford to lose

### 🔧 Technical Requirements
- Sufficient gas balance for transactions
- API keys configured (Gemini for AI analysis)
- Stable internet connection
- Engine server running continuously

### 📝 Best Practices
1. Start with "once" type to test workflow
2. Use longer intervals (5-15min) initially
3. Monitor logs for first few hours
4. Adjust parameters based on performance
5. Keep emergency stop readily accessible

## Troubleshooting

### Bot Not Executing Trades
- Check if signal is "HOLD" (no trade conditions met)
- Verify risk limits aren't too restrictive
- Ensure wallet has sufficient balance
- Check logs for error messages

### High API Costs
- Increase monitoring interval
- Reduce number of analysis nodes
- Use cached data where possible

### Unexpected Behavior
- Review logs for specific error messages
- Verify all node configurations
- Check network connectivity
- Ensure API keys are valid

## Support

For issues or questions:
1. Check logs: `GET /logs/:walletaddr`
2. Review workflow configuration
3. Test with "once" type first
4. Monitor console output

---

**Remember**: This is an automated system that will execute real trades. Always test thoroughly and never use funds you cannot afford to lose.
