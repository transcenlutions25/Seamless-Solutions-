import Fastify from 'fastify';
// Type provider removed for now due to version mismatch
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { prisma } from './db.js';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';

dotenv.config();

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    level: process.env.LOG_LEVEL || 'info',
  },
});

// app.setValidatorCompiler(validatorCompiler);
// app.setSerializerCompiler(serializerCompiler);

await app.register(cors, { origin: true, credentials: true });
await app.register(helmet);
await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
await app.register(authPlugin);

app.get('/health', async () => ({ ok: true }));
app.get('/me', { preHandler: [app.authGuard] }, async (req) => ({ user: (req as any).user }));
await authRoutes(app);

// DB ping
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
