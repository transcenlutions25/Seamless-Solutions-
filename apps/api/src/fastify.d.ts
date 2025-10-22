import 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authorizeRole: (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
      roles: Array<import('./types').JwtUser['role']>
    ) => boolean;
  }
  interface FastifyRequest {
    user?: import('./types').JwtUser;
    orgId?: string;
    traceId?: string;
  }
}
