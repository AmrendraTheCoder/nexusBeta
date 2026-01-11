import { useCallback } from "react";
import { fetchWithPayment } from "../services/x402Client";
import { useX402Session } from "./useX402Session";

// Default to localhost if env variable not set
const API_URL = import.meta.env.VITE_ENGINE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

export const useWorkflowExecution = () => {
  const { ensureBalance, isInitialized } = useX402Session();

  const executeWorkflow = useCallback(
    async (
      nodes,
      edges,
      workflowName,
      walletAddress,
      workflowType = "once"
    ) => {
      // Transform React Flow format to Engine format
      console.log('🔍 [Frontend] Starting workflow transformation...');
      console.log('📊 [Frontend] Input nodes:', nodes);
      console.log('📊 [Frontend] Input edges:', edges);
      
      const engineNodes = nodes.map((node) => {
        const nodeData = node.data.node_data || {};
        
        // Debug logging
        console.log(`\n🔧 [Frontend] Processing node ${node.id}:`);
        console.log('   - node.type:', node.type);
        console.log('   - node.data:', node.data);
        console.log('   - node.data.type:', node.data.type);
        console.log('   - node.data.node_data:', nodeData);
        
        // Get the actual workflow type from node.data.type (not React Flow's node.type)
        const workflowType = node.data.type || node.type;
        
        // Base node configuration
        const nodeConfig = {
          type: workflowType,
          id: node.id,
        };

        // Map frontend field names to engine field names
        switch (workflowType) {
          case 'sendToken':
            nodeConfig.tokenAddress = nodeData.tokenAddress || 'native';
            nodeConfig.to = nodeData.destination;
            nodeConfig.amount = nodeData.amount;
            console.log('✅ [Frontend] SendToken config:', nodeConfig);
            if (!nodeConfig.to) {
              console.error('❌ [Frontend] SendToken missing destination!');
              console.error('   - nodeData.destination:', nodeData.destination);
              console.error('   - Full nodeData:', nodeData);
            }
            if (!nodeConfig.amount) {
              console.error('❌ [Frontend] SendToken missing amount!');
            }
            break;
          
          case 'queryBalance':
            nodeConfig.walletAddress = nodeData.walletAddress;
            nodeConfig.tokenAddress = nodeData.tokenAddress || 'native';
            console.log('✅ [Frontend] QueryBalance config:', nodeConfig);
            if (!nodeConfig.walletAddress) {
              console.error('❌ [Frontend] QueryBalance missing walletAddress!');
            }
            break;
          
          case 'swap':
            nodeConfig.tokenIn = nodeData.tokenIn;
            nodeConfig.tokenOut = nodeData.tokenOut;
            nodeConfig.amountIn = nodeData.amountIn;
            nodeConfig.router = nodeData.router;
            nodeConfig.path = [nodeData.tokenIn, nodeData.tokenOut];
            break;
          
          case 'limitOrder':
            nodeConfig.makerToken = nodeData.makerToken;
            nodeConfig.takerToken = nodeData.takerToken;
            nodeConfig.makingAmount = nodeData.makingAmount;
            nodeConfig.takingAmount = nodeData.takingAmount;
            nodeConfig.chainId = nodeData.chainId || 8453; // Base mainnet
            break;
          
          case 'pyth-network':
            nodeConfig.priceFeedId = nodeData.priceFeedId || getPythFeedId(nodeData.symbol);
            nodeConfig.pythUpdateContractAddress = nodeData.pythUpdateContractAddress || '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21';
            break;
          
          case 'condition':
            // Support both formats: single condition string OR separate fields
            if (nodeData.condition) {
              nodeConfig.condition = nodeData.condition;
            } else {
              nodeConfig.leftVariable = nodeData.leftVariable;
              nodeConfig.operator = nodeData.operator || 'greaterThan';
              nodeConfig.rightValue = nodeData.rightValue;
            }
            console.log('🔍 Condition node config:', nodeConfig);
            break;
          
          case 'print':
            nodeConfig.message = nodeData.sample || nodeData.message || 'Debug message';
            break;
          
          case 'nexusPay':
            // Auto-fix: localhost URLs should use http, not https (SSL not available on localhost)
            let url = nodeData.url || '';
            if (url.startsWith('https://localhost')) {
              url = url.replace('https://localhost', 'http://localhost');
              console.log(`⚠️ [Frontend] Auto-fixed URL: https://localhost → http://localhost`);
            }
            nodeConfig.url = url;
            nodeConfig.chainId = nodeData.chainId || 240;
            nodeConfig.nexusBackendUrl = nodeData.nexusBackendUrl || 'http://localhost:3001';
            break;
          
          case 'registryQuery':
            nodeConfig.category = nodeData.category || 'news';
            nodeConfig.maxPrice = nodeData.maxPrice;
            nodeConfig.chainId = nodeData.chainId || 240;
            break;
          
          case 'healthFactor':
            nodeConfig.protocol = nodeData.protocol || 'aave';
            nodeConfig.walletAddress = nodeData.walletAddress;
            nodeConfig.threshold = nodeData.threshold || '1.5';
            nodeConfig.chainId = nodeData.chainId || 1;
            break;
          
          case 'autoRepay':
            nodeConfig.protocol = nodeData.protocol || 'aave';
            nodeConfig.repayPercentage = nodeData.repayPercentage || '50';
            nodeConfig.collateralToken = nodeData.collateralToken;
            nodeConfig.targetHealthFactor = nodeData.targetHealthFactor || '1.5';
            break;
          
          case 'liquidationAlert':
            nodeConfig.warningThreshold = nodeData.warningThreshold || '1.5';
            nodeConfig.criticalThreshold = nodeData.criticalThreshold || '1.1';
            nodeConfig.notifyEmail = nodeData.notifyEmail;
            nodeConfig.webhookUrl = nodeData.webhookUrl;
            break;
          
          case 'crossChainTrigger':
            nodeConfig.sourceChain = nodeData.sourceChain || 11155111;
            nodeConfig.destinationChain = nodeData.destinationChain || 84532;
            nodeConfig.receiver = nodeData.receiver;
            nodeConfig.protocol = nodeData.protocol || 'ccip';
            break;
          
          case 'crossChainSwap':
            nodeConfig.sourceChain = nodeData.sourceChain || 11155111;
            nodeConfig.destinationChain = nodeData.destinationChain || 84532;
            nodeConfig.tokenIn = nodeData.tokenIn;
            nodeConfig.tokenOut = nodeData.tokenOut;
            nodeConfig.amountIn = nodeData.amountIn;
            nodeConfig.slippage = nodeData.slippage || '0.5';
            break;
          
          default:
            // Copy all node_data fields for unknown types
            Object.assign(nodeConfig, nodeData);
        }

        return nodeConfig;
      });

      const engineEdges = edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        ...(edge.label && { condition: edge.label.toLowerCase() }),
      }));

      console.log('\n📦 [Frontend] Transformed engine nodes:', engineNodes);

      // Convert nodes array to object with node IDs as keys
      const nodesObject = {};
      engineNodes.forEach((node) => {
        console.log(`\n🔄 [Frontend] Converting node ${node.id} to object format:`);
        console.log('   - Original node:', node);
        
        nodesObject[node.id] = {
          type: node.type,
          label: node.id,
          node_data: { ...node }, // Put all node fields in node_data
          inputs: {},
          outputs: {}
        };
        
        console.log('   - Converted to:', nodesObject[node.id]);
        console.log('   - node_data contains:', nodesObject[node.id].node_data);
      });

      console.log('\n📦 [Frontend] Final nodesObject:', nodesObject);

      // Convert edges array to nested object format
      const edgesObject = {};
      engineEdges.forEach((edge) => {
        if (!edgesObject[edge.source]) {
          edgesObject[edge.source] = {};
        }
        // For condition nodes: convert edge label to path format
        // e.g., label "true" becomes key "true-path", label "false" becomes key "false-path"
        if (edge.condition) {
          const pathKey = `${edge.condition}-path`; // "true" → "true-path"
          edgesObject[edge.source][edge.target] = { [pathKey]: "activate" };
        } else {
          edgesObject[edge.source][edge.target] = {};
        }
      });

      const workflowData = {
        walletaddr: walletAddress,
        type: workflowType,
        nodes: nodesObject,
        edges: edgesObject,
      };

      // Add repeatInterval for repeat-type workflows (default 5 minutes)
      if (workflowType === "repeat") {
        workflowData.repeatInterval = 300000; // 5 minutes in milliseconds
        console.log(`🔁 [Frontend] Repeat workflow with ${workflowData.repeatInterval / 1000}s interval`);
      }

      console.log("\n🚀 [Frontend] FINAL WORKFLOW DATA:");
      console.log(JSON.stringify(workflowData, null, 2));
      console.log("\n🌐 [Frontend] API URL:", API_URL);

      // Add wallet configuration for transaction execution
      const requestBody = {
        json_workflow: workflowData,
        walletConfig: {
          mode: "direct",
          privateKey: import.meta.env.VITE_PRIVATE_KEY || "0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d",
          chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "240"),
          rpcUrl: import.meta.env.VITE_RPC_URL || "https://testnet.zkevm.cronos.org",
          delegateAddress: import.meta.env.VITE_DELEGATE_CONTRACT_ADDRESS || "0x78E566E5B7b10c8c93d622382d6a27d960A3D76A",
          // IMPORTANT: Pass the user's connected wallet address for payment recording
          userAddress: walletAddress
        }
      };

      // Debug: Log condition nodes to verify data
      console.log('📤 Sending workflow to backend:', JSON.stringify(workflowData, null, 2));
      const conditionNodes = Object.entries(workflowData.nodes).filter(([_, node]) => node.type === 'condition');
      if (conditionNodes.length > 0) {
        console.log('🔍 Condition nodes in request:', conditionNodes);
      }

      // Ensure x402 session balance before executing workflow
      const nodeCount = Object.keys(workflowData.nodes || {}).length;
      if (nodeCount > 0 && isInitialized) {
        try {
          await ensureBalance(nodeCount);
        } catch (error) {
          console.warn("[x402] Balance check failed, continuing anyway:", error);
        }
      }

      try {
        // Use x402 payment-enabled fetch if initialized, otherwise use regular fetch
        const fetchFn = isInitialized ? fetchWithPayment : fetch;
        
        const response = await fetchFn(`${API_URL}/workflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        // Check if response has content
        const text = await response.text();
        if (!text) {
          throw new Error("Server returned empty response. Is the engine running on " + API_URL + "?");
        }

        let result;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "Failed to execute workflow");
        }

        console.log("✅ Workflow started:", result);
        
        // Start polling for logs
        pollWorkflowLogs(workflowData.walletaddr);
        
        // Dispatch custom toast event instead of browser alert
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'success',
            title: 'Workflow Started!',
            message: 'AI agents are analyzing markets. Check the Execution Logs panel for real-time updates.'
          }
        }));
        return result;
      } catch (error) {
        console.error("Error executing workflow:", error);
        
        // If engine is not running, simulate execution for demo
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError") || error.message.includes("empty response")) {
          console.log("🎭 Engine not available, running simulated demo execution...");
          simulateWorkflowExecution(nodes, workflowData.walletaddr);
          return { success: true, simulated: true };
        } else {
          // Dispatch error toast instead of browser alert
          window.dispatchEvent(new CustomEvent('showToast', {
            detail: {
              type: 'error',
              title: '❌ Workflow Error',
              message: error.message
            }
          }));
        }
        throw error;
      }
    },
    []
  );

  // Simulate workflow execution for demo when engine is not running
  const simulateWorkflowExecution = useCallback((nodes, walletaddr) => {
    const nodeList = nodes.map(n => ({
      id: n.id,
      label: n.data?.label || n.id,
      type: n.data?.type || 'unknown'
    }));
    
    let currentIndex = 0;
    const simulatedLogs = [];
    
    const executeNextNode = () => {
      if (currentIndex >= nodeList.length) {
        // All nodes executed - dispatch completion
        window.dispatchEvent(new CustomEvent('workflowLogs', {
          detail: {
            logs: simulatedLogs,
            isRunning: false,
            status: 'completed'
          }
        }));
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('workflowCompleted', {
            detail: { status: 'success', logs: simulatedLogs }
          }));
        }, 500);
        return;
      }
      
      const node = nodeList[currentIndex];
      
      // Add "executing" log
      simulatedLogs.push({
        nodeId: node.id,
        message: `Executing node type: ${node.type}`,
        type: 'info',
        timestamp: new Date().toISOString()
      });
      
      window.dispatchEvent(new CustomEvent('workflowLogs', {
        detail: {
          logs: [...simulatedLogs],
          isRunning: true,
          status: 'running'
        }
      }));
      
      // Simulate processing time (1-2 seconds per node)
      const processingTime = 1000 + Math.random() * 1000;
      
      setTimeout(() => {
        // Add "completed" log
        simulatedLogs.push({
          nodeId: node.id,
          message: `Node execution completed`,
          type: 'success',
          timestamp: new Date().toISOString()
        });
        
        // Add result log based on node type
        const resultMessage = getSimulatedResult(node.type, node.label);
        if (resultMessage) {
          simulatedLogs.push({
            nodeId: node.id,
            message: `Execution result: ${resultMessage}`,
            type: 'success',
            timestamp: new Date().toISOString()
          });
        }
        
        window.dispatchEvent(new CustomEvent('workflowLogs', {
          detail: {
            logs: [...simulatedLogs],
            isRunning: true,
            status: 'running'
          }
        }));
        
        currentIndex++;
        executeNextNode();
      }, processingTime);
    };
    
    // Start execution
    executeNextNode();
  }, []);

  return { executeWorkflow, simulateWorkflowExecution };
};

// Helper function to generate simulated results based on node type
function getSimulatedResult(nodeType, label) {
  const results = {
    'pyth-network': JSON.stringify({ price: (94000 + Math.random() * 2000).toFixed(2), symbol: 'BTC/USD' }),
    'visionAnalysis': JSON.stringify({ sentiment: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH', confidence: (70 + Math.random() * 25).toFixed(0) + '%', pattern: 'Bull Flag detected' }),
    'newsPrediction': JSON.stringify({ sentiment: Math.random() > 0.5 ? 'Positive' : 'Negative', score: '+' + (50 + Math.floor(Math.random() * 30)), headline: 'Institutional buying increases' }),
    'tradingAgent': JSON.stringify({ signal: Math.random() > 0.5 ? 'BUY' : 'SELL', confidence: (75 + Math.random() * 20).toFixed(0) + '%', positionSize: '0.05 ETH' }),
    'riskManager': JSON.stringify({ approved: true, exposure: (15 + Math.floor(Math.random() * 10)) + '%', reason: 'Within risk parameters' }),
    'maxInvestment': JSON.stringify({ approved: true, adjustedAmount: '0', reason: 'Trade approved within limits', maxPerTrade: '0.05', maxExposure: '0.2', currentExposure: '0' }),
    'userConfirmation': JSON.stringify({ confirmed: true, userResponse: 'demo-auto-approved', timestamp: Date.now(), method: 'popup', isVirtualMode: true }),
    'condition': 'Condition evaluated: true',
    'swap': JSON.stringify({ txHash: '0x' + Math.random().toString(16).slice(2, 18), status: 'success' }),
    'sendToken': JSON.stringify({ txHash: '0x' + Math.random().toString(16).slice(2, 18), amount: '0.1 ETH' })
  };
  return results[nodeType] || null;
}

// Poll for workflow logs
const pollWorkflowLogs = async (walletaddr) => {
  const API_URL = import.meta.env.VITE_ENGINE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";
  const maxAttempts = 60;
  let attempts = 0;
  
  const pollInterval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await fetch(`${API_URL}/logs/${walletaddr}`);
      const data = await response.json();
      
      if (data.logs && data.logs.length > 0) {
        console.log("📊 Workflow Logs:", data.logs);
        
        window.dispatchEvent(new CustomEvent('workflowLogs', { 
          detail: { 
            logs: data.logs,
            isRunning: data.isRunning,
            status: data.status
          } 
        }));
      }
      
      if (!data.isRunning || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log("✅ Workflow execution completed");
        
        window.dispatchEvent(new CustomEvent('workflowCompleted', { 
          detail: { status: data.status, logs: data.logs }
        }));
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      if (attempts >= 5) {
        clearInterval(pollInterval);
      }
    }
  }, 1000);
};

// Helper function to get Pyth price feed ID from symbol
function getPythFeedId(symbol) {
  const feedIds = {
    'BTC_USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH_USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'USDT_USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    // Add more as needed
  };
  return feedIds[symbol] || feedIds['ETH_USD'];
}

