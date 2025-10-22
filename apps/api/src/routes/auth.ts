import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/dev-login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['sub', 'orgId', 'role'],
          properties: {
            sub: { type: 'string' },
            orgId: { type: 'string' },
            role: { type: 'string', enum: ['OWNER', 'STAFF', 'VENDOR', 'CLIENT'] },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const { sub, orgId, role } = (req as any).body;
      const token = await (app as any).jwt.sign({ sub, orgId, role });
      return reply.send({ token });
    }
  );
}
