import fp from 'fastify-plugin';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtUser } from '../types';

const PUBLIC_ROUTES = new Set<string>([
  '/health',
  '/auth/dev-login',
  '/auth/verify',
  '/stripe/webhook',
]);

async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  const isPublic = PUBLIC_ROUTES.has(request.routerPath ?? request.url);
  if (isPublic) return;

  const auth = request.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing bearer token' });
    return;
  }
  try {
    const payload = (await request.jwtVerify()) as unknown as JwtUser;
    request.user = payload;
    request.orgId = payload.orgId;
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' });
  }
}

export default fp(async function authPlugin(app) {
  app.addHook('onRequest', verifyJwt);

  // Org scoping: require orgId for all non-public routes
  app.addHook('preHandler', async (request, reply) => {
    const isPublic = PUBLIC_ROUTES.has(request.routerPath ?? request.url);
    if (isPublic) return;
    if (!request.orgId) {
      reply.code(400).send({ error: 'Missing org context' });
    }
  });

  app.decorate('authorizeRole', function (
    request: FastifyRequest,
    reply: FastifyReply,
    roles: Array<JwtUser['role']>
  ) {
    const role = request.user?.role;
    if (!role || !roles.includes(role)) {
      reply.code(403).send({ error: 'Forbidden' });
      return false;
    }
    return true;
  });
});
