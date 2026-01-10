/**
 * Fastify plugin for NIP-1 paywall
 * Minimal wrapper around Express-style middleware logic
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requirePayment, type PaywallConfig } from './middleware.js';

export function nip1FastifyPlugin(fastify: FastifyInstance, options: PaywallConfig, done: (err?: Error) => void) {
  const expressMiddleware = requirePayment(options);

  fastify.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    // Adapt Fastify request/response to Express signature
    const expressReq: any = {
      headers: req.headers,
      path: (req as any).routerPath || req.url
    };

    const expressRes: any = {
      status(code: number) {
        reply.status(code);
        return this;
      },
      setHeader(name: string, value: any) {
        reply.header(name, value);
      },
      json(payload: any) {
        reply.send(payload);
      }
    };

    await new Promise<void>((resolve) => {
      expressMiddleware(expressReq, expressRes, () => resolve());
    });
  });

  done();
}
