// FRONTEND WORKFLOW CONFIGURATION
// Copy this into your React Flow canvas builder

export const sampleWorkflow1 = {
  name: "Simple Balance Check & Send",
  description: "Check wallet balance, then send a small amount of ETH",
  nodes: [
    {
      id: 'check-balance',
      type: 'queryBalance',
      position: { x: 250, y: 50 },
      data: {
        label: '💰 Check Balance',
        walletAddress: '0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA',
        tokenAddress: 'native',
        config: {
          type: 'queryBalance',
          walletAddress: '0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA',
          tokenAddress: 'native'
        }
      }
    },
    {
      id: 'send-eth',
      type: 'sendToken',
      position: { x: 250, y: 200 },
      data: {
        label: '💸 Send 0.0001 ETH',
        tokenAddress: 'native',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.0001',
        config: {
          type: 'sendToken',
          tokenAddress: 'native',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '0.0001'
        }
      }
    },
    {
      id: 'success',
      type: 'print',
      position: { x: 250, y: 350 },
      data: {
        label: '✅ Success',
        message: '✅ Sent 0.0001 ETH successfully!',
        config: {
          type: 'print',
          message: '✅ Sent 0.0001 ETH successfully!'
        }
      }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'check-balance',
      target: 'send-eth',
      animated: true,
      style: { stroke: '#10b981' }
    },
    {
      id: 'e2',
      source: 'send-eth',
      target: 'success',
      animated: true,
      style: { stroke: '#10b981' }
    }
  ]
};

export const sampleWorkflow2 = {
  name: "Price-Based Conditional Send",
  description: "Check ETH price and send tokens if price > $3000",
  nodes: [
    {
      id: 'pyth-1',
      type: 'pythNode',
      position: { x: 250, y: 50 },
      data: {
        label: '📊 Get ETH Price',
        priceFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
        pythUpdateContractAddress: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21',
        config: {
          type: 'pyth-network',
          priceFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
          pythUpdateContractAddress: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21'
        }
      }
    },
    {
      id: 'cond-1',
      type: 'condition',
      position: { x: 250, y: 200 },
      data: {
        label: '🔀 Price > $3000?',
        leftVariable: 'pyth-1',
        operator: 'greaterThan',
        rightValue: '3000',
        config: {
          type: 'condition',
          leftVariable: 'pyth-1',
          operator: 'greaterThan',
          rightValue: '3000'
        }
      }
    },
    {
      id: 'send-high-price',
      type: 'sendToken',
      position: { x: 100, y: 370 },
      data: {
        label: '💸 Send (High Price)',
        tokenAddress: 'native',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.001',
        config: {
          type: 'sendToken',
          tokenAddress: 'native',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '0.001'
        }
      }
    },
    {
      id: 'print-high',
      type: 'print',
      position: { x: 100, y: 520 },
      data: {
        label: '✅ Success',
        message: '✅ ETH price > $3000! Sent 0.001 ETH',
        config: {
          type: 'print',
          message: '✅ ETH price > $3000! Sent 0.001 ETH'
        }
      }
    },
    {
      id: 'print-low',
      type: 'print',
      position: { x: 400, y: 370 },
      data: {
        label: '⏭️ Skip',
        message: '⏭️ ETH price ≤ $3000, no action taken',
        config: {
          type: 'print',
          message: '⏭️ ETH price ≤ $3000, no action taken'
        }
      }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'pyth-1',
      target: 'cond-1',
      animated: true,
      style: { stroke: '#10b981' }
    },
    {
      id: 'e2',
      source: 'cond-1',
      target: 'send-high-price',
      label: 'TRUE',
      animated: true,
      style: { stroke: '#22c55e' },
      labelStyle: { fill: '#22c55e', fontWeight: 700 }
    },
    {
      id: 'e3',
      source: 'send-high-price',
      target: 'print-high',
      animated: true,
      style: { stroke: '#10b981' }
    },
    {
      id: 'e4',
      source: 'cond-1',
      target: 'print-low',
      label: 'FALSE',
      animated: true,
      style: { stroke: '#ef4444' },
      labelStyle: { fill: '#ef4444', fontWeight: 700 }
    }
  ]
};

// Node type colors for styling
export const nodeColors = {
  queryBalance: '#3b82f6', // blue
  sendToken: '#22c55e',    // green
  print: '#8b5cf6',        // purple
  pythNode: '#f59e0b',     // amber
  condition: '#ec4899',    // pink
  swap: '#14b8a6',         // teal
  limitOrder: '#06b6d4',   // cyan
  nexusPay: '#84cc16',     // lime
  registryQuery: '#6366f1' // indigo
};

// How to use in your React Flow component:
/*
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { sampleWorkflow1, sampleWorkflow2, nodeColors } from './workflows';

function WorkflowCanvas() {
  const [nodes, setNodes] = useState(sampleWorkflow1.nodes);
  const [edges, setEdges] = useState(sampleWorkflow1.edges);

  return (
    <div style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
*/
