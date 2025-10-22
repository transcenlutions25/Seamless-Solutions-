import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Middleware to ensure queries are scoped to the user's organization
 * Adds orgId to request for easy access
 */
export async function orgScope(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user?.orgId) {
    reply.status(401).send({ error: 'Organization context required' });
    return;
  }
}

export function getOrgId(request: FastifyRequest): string {
  if (!request.user?.orgId) {
    throw new Error('Organization context not available');
  }
  return request.user.orgId;
}
