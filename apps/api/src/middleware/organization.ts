import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthRequest } from '../types';

export async function organizationMiddleware(
  request: FastifyRequest & AuthRequest,
  reply: FastifyReply
) {
  // Skip organization check for public routes and organization management
  const skipRoutes = [
    '/api/auth',
    '/api/organizations',
    '/health',
    '/docs'
  ];

  if (skipRoutes.some(route => request.url.startsWith(route))) {
    return;
  }

  if (!request.organizationId) {
    return reply.status(403).send({ 
      error: 'Organization access required' 
    });
  }
}
