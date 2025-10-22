import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { loadEnv } from '../config';

export default fp(async function jwtPlugin(app) {
  const env = loadEnv();
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { issuer: 'seamless-solutions' },
  } as any);

  app.decorateRequest('traceId', null);

  app.addHook('onRequest', async (request) => {
    // Attach a simple trace id
    request.traceId = request.id as string;
  });
});
