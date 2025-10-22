import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../index';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  orgId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

async function authMiddleware(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = await request.jwtVerify<{ userId: string }>();
      
      const user = await prisma.user.findUnique({
        where: { id: token.userId },
        select: {
          id: true,
          email: true,
          role: true,
          orgId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      };
    } catch (err) {
      reply.status(401).send({ error: 'Authentication required' });
    }
  });

  fastify.decorate('requireRole', function(allowedRoles: Role[]) {
    return async function(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
    };
  });

  fastify.decorate('requireOwner', async function(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    if (request.user.role !== Role.OWNER) {
      return reply.status(403).send({ error: 'Owner access required' });
    }
  });
}

export default fp(authMiddleware);