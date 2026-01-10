# 🚀 One-Click Demo Showcase

## Overview
This demo showcases a fully automated 24/7 Bitcoin trading system powered by multi-agent AI collaboration.

## Features

### 🤖 Multi-Agent AI System
- **Live Price Feed** - Real-time BTC/USDT price from Pyth Network oracle
- **AI Vision Agent** - Analyzes chart patterns using Gemini AI
- **News Sentiment Agent** - Scans crypto news for market sentiment
- **Trading Decision Agent** - Makes buy/sell/hold decisions based on all inputs
- **Risk Manager Agent** - Ensures trades meet safety requirements
- **Position Sizer** - Calculates optimal investment amounts

### ⚡ Key Capabilities
- **Continuous Monitoring**: Runs every 5 minutes (300s interval)
- **Real-Time Analysis**: Live price feeds + AI chart analysis
- **Risk Management**: Built-in stop-loss and take-profit levels
- **Automated Execution**: Trades execute when conditions are met
- **Live Updates**: Visual indicators show workflow progress

## How to Use

### Method 1: One-Click Demo Button
1. Click the **🚀 One Click Demo** button in the top navigation bar
2. The complete workflow will load automatically with all nodes configured
3. Click **Execute** in the sidebar to start live trading
4. Watch the live update banner for real-time status

### Method 2: Import JSON
1. Go to **Tools** → **Import Workflow**
2. Select `/workflows/demo-showcase.json`
3. Click **Execute** to start

### Method 3: Manual Build
Use these nodes in order:
```
🔴 Live BTC Price (pyth-network)
    ↓
🤖 AI Chart Analysis (visionAnalysis)
📰 News Sentiment AI (newsPrediction)
    ↓
🧠 Trading Decision AI (tradingAgent)
    ↓
🛡️ Risk Manager (riskManager)
💰 Position Sizer (maxInvestment)
    ↓
✅ Should Execute? (condition)
    ↓
⚡ Execute Trade (swap) / 📝 Log Wait Signal (log)
```

## What Judges Will See

### Visual Indicators
- **Live Update Banner**: Shows current execution status at top of screen
- **Cycle Counter**: Tracks how many analysis cycles have completed
- **Real-Time Data**: Price updates, AI signals, and confidence scores
- **Node Animations**: Nodes pulse during execution, glow green when complete

### Trading Dashboard
When workflow executes, you'll see:
- Current BTC price
- AI's trading signal (BUY/SELL/HOLD)
- Confidence percentage
- AI's reasoning and analysis
- Risk management decisions
- Trade execution status

### Repeat Mode Benefits
- **Continuous**: Runs 24/7 without manual intervention
- **Adaptive**: AI adjusts to changing market conditions
- **Safe**: Risk management prevents dangerous trades
- **Transparent**: All decisions visible in logs

## Configuration

### Adjust Execution Interval
In `demo-showcase.json`, change `repeatInterval`:
- `60000` = 1 minute (fast demo)
- `300000` = 5 minutes (recommended)
- `900000` = 15 minutes (conservative)

### Modify Risk Parameters
Edit the **Risk Manager** node:
```json
{
  "maxDrawdown": "15",    // Max portfolio loss %
  "stopLoss": "5",        // Auto-sell if price drops 5%
  "takeProfit": "10"      // Auto-sell if price gains 10%
}
```

### Change Investment Amount
Edit the **Position Sizer** node:
```json
{
  "maxInvestment": "100",  // Max USDT per trade
  "positionSizing": "fixed"
}
```

## Technical Details

### Nodes Used
1. **pyth-network**: Oracle price feeds (decentralized, tamper-proof)
2. **visionAnalysis**: Gemini AI analyzes chart screenshots
3. **newsPrediction**: Sentiment analysis from crypto news
4. **tradingAgent**: Decision-making AI (momentum strategy)
5. **riskManager**: Safety checks and position limits
6. **maxInvestment**: Position sizing logic
7. **condition**: Gates execution based on shouldTrade flag
8. **swap**: Executes trades via DEX
9. **log**: Records decisions for analysis

### Workflow Type
- **Type**: `repeat`
- **Interval**: 300 seconds (5 minutes)
- **Auto-Restart**: Yes (continues until manually stopped)

### Data Flow
```
Price Data → [Vision AI + News AI] → Trading Decision
     ↓
Risk Check → Position Size → Condition Gate
     ↓
Execute Trade / Wait for Better Opportunity
```

## Demo Script for Judges

### 1. Introduction (30 seconds)
"This is a fully autonomous trading system powered by multiple AI agents working together."

### 2. Load Demo (5 seconds)
Click **🚀 One Click Demo** button

### 3. Explain Architecture (45 seconds)
- Point to each node type
- Explain AI collaboration
- Highlight risk management

### 4. Execute (10 seconds)
Click **Execute** button, select **Repeat** mode

### 5. Show Real-Time Updates (60 seconds)
- Live update banner appears
- Nodes pulse during execution
- Trading dashboard shows results
- Point out AI reasoning and confidence
- Show cycle counter incrementing

### 6. Highlight Key Features (30 seconds)
- "Runs 24/7 without human intervention"
- "Multiple AI models collaborate on each decision"
- "Built-in risk management prevents losses"
- "Transparent - every decision is logged and explained"

## Troubleshooting

### No Updates Showing
- Check console for errors
- Ensure backend engine is running (`npm run dev` in `/engine`)
- Verify workflow is in "repeat" mode

### Workflow Stops After One Cycle
- Check that `repeatInterval` is set in workflow JSON
- Ensure workflow type is "repeat" not "once"

### "NO DATA" in Trading Dashboard
- Workflow may still be executing
- Check logs tab for console outputs
- Pyth price feed may need different network

### Payment Errors (x402)
These are non-blocking - workflow continues executing. To fix:
- Ensure deposits made to Nexus Registry
- Check wallet is connected
- Verify correct chain (Cronos zkEVM testnet)

## Performance Notes

### Expected Behavior
- First cycle: 20-30 seconds (AI models loading)
- Subsequent cycles: 10-15 seconds
- Most cycles: HOLD signal (AI waits for opportunities)
- Occasional trades: When confidence is high

### Impressive Metrics
- **Multi-Agent**: 6 AI agents collaborate per cycle
- **Frequency**: 12 analysis cycles per hour
- **Uptime**: 24/7 continuous operation
- **Safety**: 3-layer risk management system

## Next Steps

### For Development
1. Add more data sources (on-chain metrics, social sentiment)
2. Implement portfolio rebalancing
3. Add multiple asset support (ETH, SOL, etc.)
4. Create trading performance analytics dashboard

### For Production
1. Connect to mainnet DEX
2. Implement wallet security (multisig, cold storage)
3. Add monitoring and alerts
4. Scale to handle multiple strategies simultaneously

---

**Built with**: React Flow, Pyth Network, Gemini AI, TypeScript, Node.js
**Chain**: Cronos zkEVM Testnet
**Architecture**: Event-driven, multi-agent, autonomous
