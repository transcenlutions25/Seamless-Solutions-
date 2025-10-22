import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../index';
import { AuthenticatedUser, AuthRequest } from '../types';

export async function authMiddleware(
  request: FastifyRequest & AuthRequest,
  reply: FastifyReply
) {
  // Skip auth for public routes
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/health',
    '/docs'
  ];

  if (publicRoutes.some(route => request.url.startsWith(route))) {
    return;
  }

  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const decoded = request.jwt.verify(token) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      }
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid or inactive user' });
    }

    request.user = user as AuthenticatedUser;
    request.organizationId = user.organizationId || undefined;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
