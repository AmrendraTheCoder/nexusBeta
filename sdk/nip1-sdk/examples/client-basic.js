/**
 * Basic Client Example
 * 
 * This example shows how to consume NIP-1 payment-gated APIs.
 */

import { NIP1Client } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

// Setup wallet
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'your-private-key';
const RPC_URL = 'https://testnet.zkevm.cronos.org';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('🔐 Using wallet:', wallet.address);

// Create NIP1 client
const client = new NIP1Client({
  wallet,
  maxPrice: '1.0', // Maximum 1 CRO per request
  autoPay: true,   // Automatically pay when 402 received
  enableCache: true // Cache payments to avoid duplicate charges
});

async function main() {
  try {
    console.log('\n📡 Fetching premium data...\n');

    // Example 1: Simple GET request
    const data1 = await client.get('http://localhost:4000/api/data');
    console.log('✅ Data received:', data1);

    // Example 2: Same endpoint - should use cached payment
    console.log('\n📡 Fetching same endpoint again (should use cache)...\n');
    const data2 = await client.get('http://localhost:4000/api/data');
    console.log('✅ Data received (from cache):', data2);

    // Example 3: Different endpoint
    console.log('\n📡 Fetching analytics...\n');
    const analytics = await client.get('http://localhost:4000/api/analytics');
    console.log('✅ Analytics received:', analytics);

    // Example 4: POST request with data
    console.log('\n📡 Sending POST request...\n');
    const postResult = await client.post('http://localhost:4000/api/submit', {
      userId: '123',
      action: 'process'
    });
    console.log('✅ POST result:', postResult);

    console.log('\n✅ All requests completed successfully!');
    console.log('💰 Cache size:', client.getCacheSize());

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
main();
