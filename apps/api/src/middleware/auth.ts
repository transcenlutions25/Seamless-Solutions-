import { FastifyReply, FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  orgId: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    traceId?: string;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    request.user = request.user as AuthUser;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }
  };
}

export async function addTraceId(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  request.traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  reply.header('X-Trace-Id', request.traceId);
}
