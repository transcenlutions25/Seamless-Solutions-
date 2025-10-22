import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { nanoid } from 'nanoid';

declare module 'fastify' {
  interface FastifyRequest {
    traceId: string;
  }
}

const tracingPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    // Generate or extract trace ID
    const traceId = (request.headers['x-trace-id'] as string) || nanoid();
    request.traceId = traceId;
    
    // Add to response headers
    reply.header('x-trace-id', traceId);
    
    // Add to log context
    request.log = fastify.log.child({ traceId });
  });
};

export default fp(tracingPlugin, {
  name: 'tracing',
});