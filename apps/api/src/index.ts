import Fastify from 'fastify';
import prismaPlugin from './plugins/prisma';
import securityPlugins from './plugins/security';
import jwtPlugin from './plugins/jwt';
import healthRoutes from './routes/health';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import aiBidRoutes from './routes/aiBid';
import quoteJobRoutes from './routes/quotes-jobs';
import billingRoutes from './routes/billing';
import calendarRoutes from './routes/calendar';
import marketingRoutes from './routes/marketing';
import analyticsRoutes from './routes/analytics';
import filesRoutes from './routes/files';
import vendorRoutes from './routes/vendors';
import { loadEnv } from './config';

async function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
    trustProxy: true,
  });

  await app.register(prismaPlugin);
  await app.register(securityPlugins);
  await app.register(jwtPlugin);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(leadRoutes);
  await app.register(aiBidRoutes);
  await app.register(quoteJobRoutes);
  await app.register(billingRoutes);
  await app.register(calendarRoutes);
  await app.register(marketingRoutes);
  await app.register(analyticsRoutes);
  await app.register(filesRoutes);
  await app.register(vendorRoutes);

  return app;
}

async function start() {
  const env = loadEnv();
  const app = await buildServer();
  const port = Number(env.PORT ?? '4000');
  await app.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
