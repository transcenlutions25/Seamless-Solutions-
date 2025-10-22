import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { JWTPayload } from '@seamless/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    orgId?: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Decorate request with authenticate method
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: any) {
    try {
      await request.jwtVerify();
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: request.user?.userId },
        include: { org: true },
      });

      if (!user || !user.isActive) {
        return reply.code(401).send({ error: 'User not found or inactive' });
      }

      if (!user.org.isActive) {
        return reply.code(401).send({ error: 'Organization is inactive' });
      }

      // Check trial expiration
      if (user.org.trialEndsAt && new Date(user.org.trialEndsAt) < new Date()) {
        return reply.code(402).send({ error: 'Trial period has expired' });
      }

      // Add orgId to request for easy access
      request.orgId = user.orgId;
    } catch (err) {
      reply.send(err);
    }
  });

  // Role-based access control decorator
  fastify.decorate('authorize', (roles: string[]) => {
    return async function (request: FastifyRequest, reply: any) {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    };
  });

  // Org-scoped query helper
  fastify.decorate('orgScope', (request: FastifyRequest) => {
    if (!request.orgId) {
      throw new Error('Organization ID not found in request');
    }
    return { orgId: request.orgId };
  });
};

export default fp(authPlugin, {
  name: 'auth',
});