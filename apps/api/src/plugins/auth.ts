import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { z } from 'zod';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      orgId: string;
      role: 'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT';
    };
    user: {
      sub: string;
      orgId: string;
      role: 'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT';
    };
  }
}

const AuthPayload = z.object({
  sub: z.string(),
  orgId: z.string(),
  role: z.enum(['OWNER', 'STAFF', 'VENDOR', 'CLIENT']),
});

export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'insecure',
    sign: { algorithm: 'HS256' },
  });

  app.decorate('authGuard', async (request: any, reply: any) => {
    try {
      const decoded = await request.jwtVerify();
      const parsed = AuthPayload.safeParse(decoded as any);
      if (!parsed.success) {
        return reply.code(401).send({ error: 'Invalid token' });
      }
      (request as any).user = parsed.data;
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  app.decorate('requireRole', (roles: Array<'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT'>) => {
    return async (request: any, reply: any) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authGuard: (request: any, reply: any) => Promise<void>;
    requireRole: (roles: Array<'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT'>) => (request: any, reply: any) => Promise<void>;
  }
}
