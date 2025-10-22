import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authPlugin from './plugins/auth.js';

dotenv.config();

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    level: process.env.LOG_LEVEL || 'info',
  },
});

await app.register(cors, { origin: true, credentials: true });
await app.register(helmet);
await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
await app.register(authPlugin);

app.get('/health', async () => ({ ok: true }));
app.get('/me', { preHandler: [app.authGuard] }, async (req) => ({ user: (req as any).user }));

// Prisma
const prisma = new PrismaClient();
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});
app.get('/db/ping', async () => {
  await prisma.$queryRaw`select 1`;
  return { db: 'ok' };
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
app
  .listen({ port, host })
  .then(() => {
    app.log.info(`API listening on http://${host}:${port}`);
  })
  .catch((err) => {
    app.log.error({ err }, 'Failed to start server');
    process.exit(1);
  });
