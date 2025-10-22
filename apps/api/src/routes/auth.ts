import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function authRoutes(app: FastifyInstance) {
  // Dev login to mint a token for local testing
  app.post('/auth/dev-login', async (request, reply) => {
    const bodySchema = z.object({
      userId: z.string().default('dev-user'),
      orgId: z.string().default('dev-org'),
      role: z.enum(['OWNER', 'STAFF', 'VENDOR', 'CLIENT']).default('OWNER'),
      email: z.string().email().optional(),
      name: z.string().optional(),
    });
    const body = bodySchema.parse(request.body);
    const token = app.jwt.sign(body, { expiresIn: '7d' });
    return { token };
  });

  app.get('/auth/verify', async (request) => {
    try {
      await request.jwtVerify();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
}
