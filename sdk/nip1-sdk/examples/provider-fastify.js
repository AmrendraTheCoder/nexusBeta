/**
 * Example: NIP-1 Paywall with Fastify
 * Demonstrates how to use the Fastify plugin for payment gating
 */

import Fastify from 'fastify';
import { nip1FastifyPlugin } from '@nexus-ecosystem/nip1';
import { ethers } from 'ethers';

const fastify = Fastify({ logger: true });

const PROVIDER_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123';

// Free endpoint
fastify.get('/free', async (request, reply) => {
  return { message: 'This data is free!' };
});

// Premium endpoint with NIP-1 paywall
fastify.register(nip1FastifyPlugin, {
  recipient: PROVIDER_WALLET,
  price: ethers.parseEther('0.1'),
  chainId: 240,
  confirmations: 1,
  onSuccess: (txHash, req) => {
    console.log(`✅ Payment verified: ${txHash}`);
  },
  onError: (error, req, res) => {
    console.error(`❌ Payment error: ${error}`);
  }
});

fastify.get('/premium', async (request, reply) => {
  // This only executes after payment is verified
  return {
    data: 'Premium content unlocked!',
    payment: request.payment
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
    console.log('🚀 Fastify server with NIP-1 running on port 3001');
    console.log('\nEndpoints:');
    console.log('  GET /free     - No payment required');
    console.log('  GET /premium  - Requires 0.1 token payment');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
