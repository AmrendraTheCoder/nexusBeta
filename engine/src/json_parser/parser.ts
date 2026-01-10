import type { WorkflowSchema } from "../schema/WorkflowSchema.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";
import { ConditionNode } from "../components/ConditionNode.js";
import { PythNode } from "../components/PythNode.js";
import { PrintNode } from "../components/PrintNode.js";
import { UniswapNode } from "../components/UniswapNode.js";
import { sendTokenNode } from "../components/sendTokenNode.js";
import { QueryBalanceNode } from "../components/QueryBalanceNode.js";
import { LimitOrderNode } from "../components/LimitOrderNode.js";
import { NexusPayNode } from "../components/NexusPayNode.js";
import { RegistryQueryNode } from "../components/RegistryQueryNode.js";
import { TradingAgentNode } from "../components/TradingAgentNode.js";
import { StopLossNode } from "../components/StopLossNode.js";
import { RiskManagerNode } from "../components/RiskManagerNode.js";
import { AIPredictionNode } from "../components/AIPredictionNode.js";
import { VisionAnalysisNode } from "../components/VisionAnalysisNode.js";
import { MaxInvestmentNode } from "../components/MaxInvestmentNode.js";
import { DailyLossLimitNode } from "../components/DailyLossLimitNode.js";
import { UserConfirmationNode } from "../components/UserConfirmationNode.js";
import { APYMonitorNode } from "../components/APYMonitorNode.js";
import { YieldOptimizerNode } from "../components/YieldOptimizerNode.js";
import { ArbitrageNode } from "../components/ArbitrageNode.js";
import { CrossChainArbitrageNode } from "../components/CrossChainArbitrageNode.js";
import { NewsPredictionNode } from "../components/NewsPredictionNode.js";
import { Workflow } from "../components/Workflow.js";
import type { Node as NodeInterface } from "../interfaces/Node.js";
import type { Edges } from "../interfaces/Edges.js";
import type { Node } from "../interfaces/Node.js";

/**
 * Parse workflow JSON schema into executable Workflow object
 * @param json_workflow The workflow schema
 * @param walletConfig Optional wallet configuration for transaction nodes
 */
export function parse_workflow(
  json_workflow: WorkflowSchema, 
  walletConfig?: WalletConfig
) {
  const type: string = json_workflow.type;
  const nodes: Record<string, Node> = {};
  const edges: Edges = json_workflow.edges;

  console.log(`\n📋 Parsing workflow with ${Object.keys(json_workflow.nodes).length} nodes`);
  if (walletConfig) {
    console.log(`   Wallet mode: ${walletConfig.mode}`);
    console.log(`   Chain ID: ${walletConfig.chainId}`);
  }

  //Parse nodes
  for (const [id, schema] of Object.entries(json_workflow.nodes)) {
    // Support both nested node_data format and flat format from frontend
    const nodeData = schema.node_data ?? {};
    const flatData = schema as any; // For flat format from frontend
    
    switch (schema.type) {
      case "pyth-network":
        nodes[id] = new PythNode(
          id, 
          schema.label || flatData.id, 
          nodeData.priceFeedId || nodeData.symbol || flatData.priceFeedId || flatData.symbol,
          nodeData.pythUpdateContractAddress || flatData.pythUpdateContractAddress
        );
        break;
      case "condition":
        // Extract condition parameters
        const conditionData = nodeData.condition || nodeData;
        const leftVar = nodeData.leftVariable || flatData.leftVariable;
        const operator = nodeData.operator || flatData.operator;
        const rightVal = nodeData.rightValue || flatData.rightValue;
        
        // Build condition object or string
        let conditionExpression;
        if (leftVar && operator && rightVal !== undefined) {
          conditionExpression = {
            leftVariable: leftVar,
            operator: operator,
            rightValue: rightVal
          };
        } else if (typeof conditionData === 'string') {
          conditionExpression = conditionData;
        } else {
          conditionExpression = conditionData;
        }
        
        nodes[id] = new ConditionNode(
          id,
          schema.label || flatData.id,
          schema.inputs || {},
          conditionExpression
        );
        break;
      case "print":
        nodes[id] = new PrintNode(
          id, 
          schema.label || flatData.id, 
          schema.inputs || {},
          nodeData.message || flatData.message
        );
        break;
      case "swap":
        nodes[id] = new UniswapNode(
          id, 
          schema.label || flatData.id, 
          nodeData.tokenIn || flatData.tokenIn, 
          nodeData.tokenOut || flatData.tokenOut, 
          BigInt(nodeData.amountIn || flatData.amountIn || 0), 
          BigInt(nodeData.amountOutMin || flatData.amountOutMin || 0),
          walletConfig,  // Pass wallet config
          nodeData.routerAddress || flatData.router || flatData.routerAddress,
          nodeData.recipientAddress || flatData.recipientAddress,
          nodeData.deadlineSeconds || flatData.deadlineSeconds
        );
        break;
      case "sendToken":
        console.log(`🔍 [Parser] Creating sendToken node ${id}:`);
        console.log(`   - nodeData:`, nodeData);
        console.log(`   - flatData:`, flatData);
        // Try both 'to' and 'destination' field names from both sources
        const tokenAddr = nodeData.tokenAddress || flatData.tokenAddress || "native";
        const dest = nodeData.to || nodeData.destination || flatData.to || flatData.destination;
        const amt = nodeData.amount || flatData.amount;
        console.log(`   - tokenAddress: ${tokenAddr}`);
        console.log(`   - destination: ${dest}`);
        console.log(`   - amount: ${amt}`);
        
        if (!dest) {
          console.error(`❌ [Parser] sendToken node ${id} has no destination!`);
          console.error(`   Full schema:`, JSON.stringify(schema, null, 2));
        }
        if (!amt) {
          console.error(`❌ [Parser] sendToken node ${id} has no amount!`);
        }
        
        nodes[id] = new sendTokenNode(
          id, 
          schema.label || flatData.id, 
          tokenAddr, 
          dest, 
          amt,
          walletConfig  // Pass wallet config
        );
        break;
      case "queryBalance":
        console.log(`🔍 [Parser] Creating queryBalance node ${id}:`);
        console.log(`   - nodeData:`, nodeData);
        console.log(`   - flatData:`, flatData);
        const qTokenAddr = nodeData.tokenAddress || flatData.tokenAddress || "native";
        const qWalletAddr = nodeData.walletAddress || flatData.walletAddress;
        console.log(`   - tokenAddress: ${qTokenAddr}`);
        console.log(`   - walletAddress: ${qWalletAddr}`);
        
        if (!qWalletAddr) {
          console.error(`❌ [Parser] queryBalance node ${id} has no walletAddress!`);
          console.error(`   Full schema:`, JSON.stringify(schema, null, 2));
        }
        
        nodes[id] = new QueryBalanceNode(
          id, 
          schema.label || flatData.id, 
          qTokenAddr, 
          qWalletAddr
        );
        break;
      case "limitOrder":
        nodes[id] = new LimitOrderNode(
          id, 
          schema.label, 
          nodeData.makerToken, 
          nodeData.takerToken, 
          nodeData.makingAmount, 
          nodeData.takingAmount,
          walletConfig,  // Pass wallet config
          nodeData.apiKey,
          nodeData.expiresInSeconds
        );
        break;
      // ========== NEXUS NODES ==========
      case "nexusPay":
        // Support both globalContext (preferred) and walletConfig (frontend compatibility)
        const globalCtx = (json_workflow as any).globalContext || {};
        const privateKey = globalCtx.userPrivateKey 
          || nodeData.userPrivateKey 
          || walletConfig?.privateKey; // Fallback to walletConfig from request
        const chainIdForPay = globalCtx.chainId 
          || nodeData.chainId 
          || walletConfig?.chainId 
          || 240; // Default to Cronos zkEVM Testnet
        const rpcUrlForPay = globalCtx.rpcUrl 
          || nodeData.rpcUrl 
          || walletConfig?.rpcUrl 
          || 'https://testnet.zkevm.cronos.org';
        // Use the connected wallet's address (from frontend) for payment recording
        const userAddress = walletConfig?.userAddress 
          || globalCtx.userAddress 
          || nodeData.userAddress;
        
        nodes[id] = new NexusPayNode(
          id,
          schema.label,
          {
            url: nodeData.url,
            method: nodeData.method || flatData.method || 'GET',
            body: nodeData.body || flatData.body,
            headers: nodeData.headers || flatData.headers,
            // Nexus backend integration fields
            nexusBackendUrl: nodeData.nexusBackendUrl,
            provider: nodeData.provider,
            amount: nodeData.amount
          },
          {
            userPrivateKey: privateKey,
            userAddress: userAddress, // Use connected wallet address for recording
            chainId: chainIdForPay,
            rpcUrl: rpcUrlForPay,
            maxPrice: globalCtx.maxPrice || nodeData.maxPrice || '10.0'
          }
        );
        break;
      case "registryQuery":
        nodes[id] = new RegistryQueryNode(
          id,
          schema.label,
          nodeData.category || "news",
          nodeData.maxPrice || "1000000000000000000",
          nodeData.chainId || 240,
          nodeData.registryAddress || ""
        );
        break;
      // ========== AI TRADING NODES ==========
      case "aiPrediction":
        nodes[id] = new AIPredictionNode(
          id,
          schema.label || "AI Prediction",
          {
            symbol: nodeData.symbol || "BTC",
            apiUrl: nodeData.apiUrl || "http://localhost:4000/api/predictions/btc",
            provider: nodeData.provider || "",
            paymentAmount: nodeData.paymentAmount || "1000000000000000",
            chainId: nodeData.chainId || 240,
            nexusBackendUrl: nodeData.nexusBackendUrl || "http://localhost:3001",
          },
          json_workflow.walletaddr || "",
          walletConfig
        );
        break;
      case "tradingAgent":
        nodes[id] = new TradingAgentNode(
          id,
          schema.label || "Trading Agent",
          {
            symbol: nodeData.symbol || "BTC",
            strategy: nodeData.strategy || "ai-signal",
            riskLevel: nodeData.riskLevel || "moderate",
            maxPositionSize: nodeData.maxPositionSize || "0.5",
            stopLossPercent: nodeData.stopLossPercent || 5,
            takeProfitPercent: nodeData.takeProfitPercent || 10,
            maxDailyLoss: nodeData.maxDailyLoss || "0.1",
          },
          walletConfig,
          nodeData.nexusBackendUrl || "http://localhost:3001"
        );
        break;
      case "stopLoss":
        nodes[id] = new StopLossNode(
          id,
          schema.label || "Stop Loss Monitor",
          {
            symbol: nodeData.symbol || "BTC",
            entryPrice: parseFloat(nodeData.entryPrice) || 0,
            stopLossPrice: parseFloat(nodeData.stopLossPrice) || 0,
            takeProfitPrice: parseFloat(nodeData.takeProfitPrice) || 0,
            positionType: nodeData.positionType || "long",
            positionSize: nodeData.positionSize || "0",
            trailingStop: nodeData.trailingStop || false,
            trailingPercent: nodeData.trailingPercent || 2,
          },
          walletConfig
        );
        break;
      case "riskManager":
        nodes[id] = new RiskManagerNode(
          id,
          schema.label || "Risk Manager",
          {
            maxPortfolioRisk: nodeData.maxPortfolioRisk || 30,
            maxSinglePositionSize: nodeData.maxSinglePositionSize || 10,
            maxDailyLoss: nodeData.maxDailyLoss || 5,
            maxOpenPositions: nodeData.maxOpenPositions || 3,
            minBalanceReserve: nodeData.minBalanceReserve || 20,
            correlationLimit: nodeData.correlationLimit || 0.7,
          },
          {
            totalBalance: nodeData.totalBalance || "1.0",
            availableBalance: nodeData.availableBalance || "1.0",
            openPositions: nodeData.openPositions || 0,
            dailyPnL: nodeData.dailyPnL || 0,
            totalExposure: nodeData.totalExposure || 0,
          },
          walletConfig
        );
        break;
      case "visionAnalysis":
        nodes[id] = new VisionAnalysisNode(
          id,
          schema.label || "Vision Analysis",
          {
            prompt: nodeData.prompt || "Analyze this chart and provide trading recommendations",
            persona: nodeData.persona || "default",
            imageUrl: nodeData.imageUrl,
            imageBase64: nodeData.imageBase64,
            analysisType: nodeData.analysisType || "chart",
            outputFormat: nodeData.outputFormat || "both",
            apiProvider: nodeData.apiProvider || "gemini", // Default to real Gemini API
            apiKey: nodeData.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY,
          },
          walletConfig
        );
        break;
      // ========== TRUST & SAFETY NODES (COMPULSORY) ==========
      case "maxInvestment":
        nodes[id] = new MaxInvestmentNode(
          id,
          schema.label || "Max Investment Limit",
          {
            maxAmountPerTrade: nodeData.maxAmountPerTrade || "0.1",
            maxTotalExposure: nodeData.maxTotalExposure || "0.5",
            currency: nodeData.currency || "CRO",
            enforceLimit: nodeData.enforceLimit !== false,
          },
          walletConfig
        );
        break;
      case "dailyLossLimit":
        nodes[id] = new DailyLossLimitNode(
          id,
          schema.label || "Daily Loss Limit",
          {
            maxDailyLossPercent: nodeData.maxDailyLossPercent || 5,
            maxDailyLossAmount: nodeData.maxDailyLossAmount || "0.05",
            pauseOnLimit: nodeData.pauseOnLimit !== false,
            resetTime: nodeData.resetTime || "00:00",
            notifyOnWarning: nodeData.notifyOnWarning !== false,
          },
          walletConfig
        );
        break;
      case "userConfirmation":
        nodes[id] = new UserConfirmationNode(
          id,
          schema.label || "User Confirmation",
          {
            requireConfirmation: nodeData.requireConfirmation !== false,
            confirmationMethod: nodeData.confirmationMethod || "popup",
            timeoutSeconds: nodeData.timeoutSeconds || 60,
            showDetails: nodeData.showDetails !== false,
            allowAutoApprove: nodeData.allowAutoApprove || false,
            minConfirmationDelay: nodeData.minConfirmationDelay || 3,
          },
          walletConfig
        );
        break;
      // ========== DEFI YIELD NODES ==========
      case "apyMonitor":
        nodes[id] = new APYMonitorNode(
          id,
          schema.label || "APY Monitor",
          {
            protocols: nodeData.protocols || ["aave-v3", "compound-v3", "curve-3pool", "yearn-usdc"],
            asset: nodeData.asset || "USDC",
            minAPY: nodeData.minAPY || 0,
            useRealAPI: nodeData.useRealAPI !== false,
            chain: nodeData.chain || "Ethereum",
          },
          walletConfig
        );
        break;
      case "yieldOptimizer":
        nodes[id] = new YieldOptimizerNode(
          id,
          schema.label || "Yield Optimizer",
          {
            currentProtocol: nodeData.currentProtocol || "aave-v3",
            depositAmount: nodeData.depositAmount || "1000",
            minProfitThreshold: nodeData.minProfitThreshold || 0.5,
            gasPrice: nodeData.gasPrice || "30",
            projectionMonths: nodeData.projectionMonths || 12,
          },
          walletConfig
        );
        break;
      
      // ========== ARBITRAGE NODES ==========
      case "arbitrage":
        nodes[id] = new ArbitrageNode(
          id,
          schema.label || "DEX Arbitrage Scanner",
          {
            tokenIn: nodeData.tokenIn || "USDC",
            tokenOut: nodeData.tokenOut || "WETH",
            amount: nodeData.amount || "1000000000",
            dexes: nodeData.dexes || ["uniswap", "sushiswap", "1inch"],
            minProfitPercent: nodeData.minProfitPercent || 0.5,
            maxSlippage: nodeData.maxSlippage || 1,
            includeGasCost: nodeData.includeGasCost !== false,
            chainId: nodeData.chainId || 1,
            useMEVProtection: nodeData.useMEVProtection || false,
          },
          walletConfig
        );
        break;
      case "crossChainArbitrage":
        nodes[id] = new CrossChainArbitrageNode(
          id,
          schema.label || "Cross-Chain Arbitrage",
          {
            token: nodeData.token || "ETH",
            amount: nodeData.amount || "1",
            chains: nodeData.chains || ["ethereum", "arbitrum", "optimism", "base"],
            minProfitPercent: nodeData.minProfitPercent || 0.5,
            maxBridgeTime: nodeData.maxBridgeTime || 30,
            includeBridgeCost: nodeData.includeBridgeCost !== false,
          },
          walletConfig
        );
        break;
      case "newsPrediction":
        nodes[id] = new NewsPredictionNode(
          id,
          schema.label || "News Prediction",
          {
            symbol: nodeData.symbol || "BTC",
            newsSource: nodeData.newsSource || "aggregated",
            lookbackHours: nodeData.lookbackHours || 24,
            minConfidence: nodeData.minConfidence || 50,
            includePatternAnalysis: nodeData.includePatternAnalysis !== false,
            apiKey: nodeData.apiKey,
          },
          walletConfig
        );
        break;

      default:
        console.warn(`Unknown node type: ${schema.type} at node ${id}`);
    }
  }

  console.log(`✅ Parsed ${Object.keys(nodes).length} nodes successfully`);

  const workflowName = json_workflow.name || "Unnamed Workflow";
  return new Workflow(type, nodes, edges, workflowName);
}


