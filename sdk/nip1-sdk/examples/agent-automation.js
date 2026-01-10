/**
 * AI Agent Automation Example
 * 
 * This example demonstrates how an AI agent can autonomously access
 * premium data sources using NIP-1 payments.
 */

import { NIP1Client, autoPayFetch } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

// AI Agent Configuration
const AGENT_CONFIG = {
  name: 'DeFi Trading Agent',
  budget: ethers.parseEther('10.0'), // 10 CRO budget
  maxPricePerCall: ethers.parseEther('0.5'), // Max 0.5 CRO per call
  dataProviders: [
    'http://localhost:4000/api/data',
    'http://localhost:4000/api/analytics',
    'http://localhost:4000/api/predictions'
  ]
};

// Setup agent wallet
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || 'your-agent-private-key';
const RPC_URL = 'https://testnet.zkevm.cronos.org';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const agentWallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`🤖 Starting ${AGENT_CONFIG.name}`);
console.log(`💼 Agent wallet: ${agentWallet.address}`);
console.log(`💰 Budget: ${ethers.formatEther(AGENT_CONFIG.budget)} CRO\n`);

// Track spending
let totalSpent = 0n;

// Create NIP1 client with callbacks
const client = new NIP1Client({
  wallet: agentWallet,
  maxPrice: AGENT_CONFIG.maxPricePerCall,
  autoPay: true,
  
  // Before payment callback - check budget
  beforePayment: async (details) => {
    console.log(`💸 Payment required: ${details.amountFormatted}`);
    
    const newTotal = totalSpent + details.amount;
    
    if (newTotal > AGENT_CONFIG.budget) {
      console.log('❌ Budget exceeded! Cancelling payment.');
      return false; // Cancel payment
    }
    
    console.log(`✅ Budget check passed (${ethers.formatEther(newTotal)}/${ethers.formatEther(AGENT_CONFIG.budget)} CRO)`);
    return true; // Proceed with payment
  },
  
  // After payment callback - track spending
  afterPayment: async (txHash, details) => {
    totalSpent += details.amount;
    console.log(`📝 Payment recorded: ${txHash}`);
    console.log(`💰 Total spent: ${ethers.formatEther(totalSpent)} CRO\n`);
  }
});

// Agent decision-making logic
async function makeTradeDecision() {
  try {
    console.log('🔍 Gathering market intelligence...\n');

    // Fetch data from multiple premium sources
    const [marketData, analytics] = await Promise.all([
      client.get(AGENT_CONFIG.dataProviders[0]),
      client.get(AGENT_CONFIG.dataProviders[1])
    ]);

    console.log('📊 Market Data:', marketData);
    console.log('📈 Analytics:', analytics);

    // Agent decision logic
    const decision = {
      action: 'BUY',
      asset: 'ETH',
      amount: '0.1',
      confidence: 0.85,
      reason: 'Positive sentiment + strong analytics'
    };

    console.log('\n🎯 Trading Decision:', decision);

    return decision;

  } catch (error) {
    console.error('❌ Agent error:', error.message);
    return null;
  }
}

// Automated workflow
async function runAgentWorkflow() {
  console.log('🚀 Starting automated workflow...\n');

  // Loop: Make decisions every 30 seconds
  let iteration = 1;
  
  while (totalSpent < AGENT_CONFIG.budget) {
    console.log(`\n━━━ Iteration ${iteration} ━━━\n`);
    
    const decision = await makeTradeDecision();
    
    if (!decision) {
      console.log('⚠️ Failed to make decision, retrying...');
      await sleep(10000);
      continue;
    }

    console.log(`\n✅ Iteration ${iteration} completed`);
    console.log(`💰 Remaining budget: ${ethers.formatEther(AGENT_CONFIG.budget - totalSpent)} CRO`);
    
    iteration++;
    
    // Wait before next iteration
    await sleep(30000); // 30 seconds
  }

  console.log('\n🏁 Budget exhausted. Agent shutting down.');
  console.log(`📊 Total iterations: ${iteration - 1}`);
  console.log(`💸 Total spent: ${ethers.formatEther(totalSpent)} CRO`);
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Alternative: One-off fetch with auto-pay
async function simpleAgentCall() {
  console.log('🤖 Making one-off agent call...\n');

  try {
    const data = await autoPayFetch(
      'http://localhost:4000/api/data',
      {
        wallet: agentWallet,
        maxPrice: '0.5'
      }
    );

    console.log('✅ Data received:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the agent
const args = process.argv.slice(2);

if (args[0] === 'simple') {
  simpleAgentCall();
} else if (args[0] === 'workflow') {
  runAgentWorkflow();
} else {
  console.log('Usage:');
  console.log('  node agent-automation.js simple    - Run one-off call');
  console.log('  node agent-automation.js workflow  - Run automated workflow');
}
