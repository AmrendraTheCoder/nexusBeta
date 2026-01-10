/**
 * @nexus-ecosystem/nip1 - Official NIP-1 SDK
 * 
 * This package provides both provider and client implementations for the
 * Nexus Interface Protocol (NIP-1) HTTP 402 payment standard.
 */

// Provider SDK
export { requirePayment, type PaywallConfig } from './provider/middleware.js';
export { verifyPayment, verifyPaymentWithRetry } from './provider/verify.js';
export { PaymentCache } from './provider/cache.js';
export { nip1FastifyPlugin } from './provider/fastify.js';

// Client SDK
export { NIP1Client } from './client/client.js';
export { autoPayFetch } from './client/auto-pay.js';

// Utilities
export { 
  parsePaymentRequired, 
  createPaymentProof, 
  parsePaymentProof
} from './utils/helpers.js';

// Types
export type {
  NIP1Headers,
  NIP1Response,
  SupportedChain,
  PaymentConfig,
  PaymentDetails,
  PaymentProof,
  VerificationResult
} from './types/index.js';
