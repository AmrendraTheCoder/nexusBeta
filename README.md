# 🚀 NexusFlow - Visual Multi-Agent AI Trading Protocol

> **AutonomousHacks Hackathon Submission** | No-code platform where multiple AI agents collaborate autonomously to analyze markets, make trading decisions, and execute blockchain transactions.

![NexusFlow Banner](https://img.shields.io/badge/AI%20Agents-7%20Specialized-purple) ![Blockchain](https://img.shields.io/badge/Blockchain-Cronos%20zkEVM-blue) ![Status](https://img.shields.io/badge/Status-Demo%20Ready-green)

## 🎯 Problem Statement

Cryptocurrency trading requires constant monitoring, technical analysis expertise, and emotional discipline. Retail traders lose money due to:
- Inability to monitor markets 24/7
- Lack of technical analysis skills  
- Emotional decision-making
- Complexity of DeFi protocols

**Existing solutions** are either too simple (single strategy bots) or require coding knowledge to customize.

## 💡 Solution: Multi-Agent AI Collaboration

NexusFlow is a **visual, no-code platform** that enables users to create autonomous AI trading systems through a drag-and-drop workflow builder. Multiple specialized AI agents work together like a professional trading desk.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT TRADING WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   📊 Price Oracle ──┬──► 👁️ Vision Agent ──┐                           │
│   (Pyth Network)    │                       │                           │
│                     │                       ▼                           │
│                     └──► 📰 News Agent ───► 🤖 Trading Agent            │
│                                                    │                    │
│                                                    ▼                    │
│                              ┌─────────────────────┴─────────────────┐  │
│                              │                                       │  │
│                              ▼                                       ▼  │
│                        🛡️ Risk Manager              💰 Investment Guard │
│                              │                                       │  │
│                              └─────────────────────┬─────────────────┘  │
│                                                    │                    │
│                                                    ▼                    │
│                                            ✅ User Confirmation         │
│                                                    │                    │
│                                                    ▼                    │
│                                          ⛓️ Blockchain Execution        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🤖 The 7 AI Agents

| Agent | Role | Autonomous Behavior |
|-------|------|---------------------|
| 📊 **Price Oracle** | Fetches real-time BTC/ETH prices | Connects to Pyth Network decentralized oracles |
| 👁️ **Vision Agent** | Analyzes chart patterns | Uses Gemini Vision AI to detect bull flags, head & shoulders, support/resistance |
| 📰 **News Agent** | Sentiment analysis | Scans crypto news, correlates with historical price patterns |
| 🤖 **Trading Agent** | Decision making | Synthesizes all inputs to generate BUY/SELL/HOLD with confidence scores |
| 🛡️ **Risk Manager** | Safety enforcement | Autonomously blocks trades exceeding portfolio exposure limits |
| 💰 **Investment Guard** | Limit enforcement | Ensures trades don't exceed user-defined maximum investment |
| ✅ **User Confirmation** | Human-in-the-loop | Optional final approval before execution |

## ✨ Key Agentic Features

- **Multi-Agent Collaboration**: 7 specialized agents work together autonomously
- **Agent Checks & Balances**: Risk Manager can override Trading Agent decisions
- **Vision-Based Analysis**: AI analyzes actual chart images, not just numbers
- **News-Pattern Correlation**: Predicts market reactions by matching news to historical patterns
- **DAG Execution Engine**: Kahn's algorithm ensures proper agent communication order
- **Real-Time Agent Chat**: Watch agents communicate during workflow execution
- **One-Click Demo**: Pre-built 7-agent workflow for instant demonstration
- **Blockchain Execution**: Trustless trade execution on Cronos zkEVM

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, ReactFlow, TailwindCSS, Vite, lightweight-charts |
| **Backend** | Node.js, Express.js, Vercel Serverless |
| **AI/ML** | Google Gemini Vision API, Custom NLP Sentiment Analysis |
| **Blockchain** | Solidity, Hardhat, Cronos zkEVM, ethers.js, wagmi |
| **Data** | Pyth Network (oracles), CryptoCompare API (news) |
| **Architecture** | DAG engine (Kahn's algorithm), dagre (graph layout) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- API Keys: Google Gemini (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nexusflow.git
cd nexusflow

# Install all dependencies
npm install
npm run setup

# Configure environment variables
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env
# Edit .env files with your API keys
```

### Environment Variables

**backend/.env:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

**contracts/.env:**
```env
PRIVATE_KEY=your_wallet_private_key_here
```

### Run the Application

```bash
# Start all services (frontend + backend)
npm run dev
```

Open http://localhost:5173 in your browser.

### Try the Demo

1. Connect MetaMask to **Cronos zkEVM Testnet** (Chain ID: 282)
2. Click the **"🚀 Try AI Trading Demo"** button in the header
3. Watch the 7-agent workflow load automatically
4. Click **"Execute Workflow"** to see agents collaborate
5. View the **Agent Chat Log** for real-time agent communication
6. See the **Trading Result Modal** with full analysis

## 📁 Project Structure

```
nexusflow/
├── frontend/                 # React UI with workflow canvas
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorkflowCanvas.jsx    # ReactFlow canvas
│   │   │   ├── AgentChatLog.jsx      # Real-time agent chat
│   │   │   ├── WorkflowResultModal.jsx # Trading results
│   │   │   └── CustomNode.jsx        # Agent node component
│   │   ├── config/
│   │   │   └── nodeConfig.js         # Agent configurations
│   │   └── hooks/
│   │       └── useWorkflowExecution.js
│   │
├── engine/                   # TypeScript workflow execution
│   └── src/
│       └── components/
│           ├── Workflow.ts           # DAG execution (Kahn's algorithm)
│           ├── VisionAnalysisNode.ts # Gemini Vision integration
│           ├── TradingAgentNode.ts   # Signal generation
│           ├── RiskManagerNode.ts    # Risk validation
│           └── NewsPredictionNode.ts # News sentiment
│
├── backend/                  # Express.js API server
│   ├── server.js
│   └── aiService.js          # Gemini API integration
│
├── contracts/                # Solidity smart contracts
│   └── src/
│       ├── NexusTreasury.sol # Deposit management
│       └── NexusRegistry.sol # Provider registry
│
└── sdk/                      # Payment protocol SDK
```

## 🔗 Smart Contracts (Cronos zkEVM Testnet)

| Contract | Address |
|----------|---------|
| NexusTreasury | `0x86c83A39EcD5f4F4345bc61Eec6eC790C895c4A7` |
| NexusRegistry | `0xe821fAbc3d23790596669043b583e931d8fC2710` |
| SessionKeyManager | `0x59BD809Fc780195B80877Bc3Cf34d5608b2752E2` |

## 🦊 MetaMask Configuration

**Cronos zkEVM Testnet:**
| Setting | Value |
|---------|-------|
| Network Name | Cronos zkEVM Testnet |
| RPC URL | https://testnet.zkevm.cronos.org |
| Chain ID | 282 |
| Symbol | zkTCRO |
| Explorer | https://explorer.zkevm.cronos.org/testnet |

**Get Testnet Tokens:** https://cronos.org/faucet

## 🏗️ Architecture

### Stateless Design (Cost Efficient)
- **Frontend**: Stateless React app, state in browser memory
- **Backend**: Stateless Express API, no server-side sessions
- **State Layer**: Blockchain (persistent) + localStorage (cache)

### DAG Execution Engine
```typescript
// Kahn's Algorithm for topological agent execution
while (queue.length > 0) {
  const nodeId = queue.shift();
  const node = nodes.get(nodeId);
  
  // Execute agent
  const result = await node.execute(inputs);
  
  // Pass outputs to dependent agents
  for (const dependent of node.dependents) {
    dependent.receiveInput(result);
    if (dependent.allInputsReady()) {
      queue.push(dependent.id);
    }
  }
}
```

## 🎥 Demo Workflow

The one-click demo creates this agent workflow:

1. **📊 Live BTC Price** → Fetches from Pyth Network oracle
2. **👁️ Vision Agent** → Analyzes chart patterns with Gemini AI
3. **📰 News Agent** → Scans news and correlates with price history
4. **🤖 Trading Agent** → Generates BUY/SELL signal with confidence
5. **🛡️ Risk Manager** → Validates against portfolio limits
6. **💰 Investment Guard** → Enforces maximum trade size
7. **✅ User Confirmation** → Human approval before execution

## 🔮 Future Enhancements

- [ ] More AI Agents (Technical Indicators, Whale Tracker, Social Sentiment)
- [ ] Agent Learning (Reinforcement learning from trade outcomes)
- [ ] Cross-Chain Execution (Ethereum, Arbitrum, Base)
- [ ] Agent Marketplace (Share/sell custom agent configurations)
- [ ] Backtesting Engine (Historical simulation)
- [ ] Mobile App (React Native)
- [ ] Voice Interface ("Create a workflow that buys BTC when news is bullish")

## 🏆 Innovation & Uniqueness

1. **Visual Multi-Agent Orchestration** - First no-code platform for connecting AI trading agents
2. **Vision AI for Charts** - Feeds actual chart images to AI, mimicking human traders
3. **News-Pattern Correlation** - Combines NLP with time-series analysis
4. **Agent Checks & Balances** - Multi-agent oversight prevents rogue decisions
5. **Blockchain-Native** - Transparent, auditable AI trading decisions

## 👥 Team

Built for **AutonomousHacks Hackathon** - Demonstrating the power of multi-agent AI systems for autonomous trading.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>🤖 NexusFlow - Where AI Agents Collaborate to Trade</b><br>
  <i>Built with ❤️ for AutonomousHacks</i>
</p>
