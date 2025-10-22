import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from './config';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth';
import { leadRoutes } from './routes/leads';
import { bidRoutes } from './routes/bids';
import { quoteRoutes } from './routes/quotes';
import { jobRoutes } from './routes/jobs';
import { invoiceRoutes } from './routes/invoices';
import { vendorRoutes } from './routes/vendors';
import { calendarRoutes } from './routes/calendar';
import { campaignRoutes } from './routes/campaigns';
import { analyticsRoutes } from './routes/analytics';
import { fileRoutes } from './routes/files';
import { webhookRoutes } from './routes/webhooks';
import { errorHandler } from './utils/errorHandler';
import { authMiddleware } from './middleware/auth';

// Initialize Prisma and Redis
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const redis = new Redis(config.redis.url);

const fastify = Fastify({
  logger: logger,
  requestIdLogLabel: 'traceId',
  genReqId: () => {
    return Math.random().toString(36).substring(2, 15);
  }
});

async function buildApp() {
  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: redis,
  });

  // JWT plugin
  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Seamless Solutions API',
        description: 'Multi-tenant service business platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Health check
  fastify.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch (error) {
      fastify.log.error(error);
      throw fastify.httpErrors.serviceUnavailable('Service unhealthy');
    }
  });

  // Register auth middleware
  fastify.register(authMiddleware);

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(leadRoutes, { prefix: '/api/leads' });
  await fastify.register(bidRoutes, { prefix: '/api/bids' });
  await fastify.register(quoteRoutes, { prefix: '/api/quotes' });
  await fastify.register(jobRoutes, { prefix: '/api/jobs' });
  await fastify.register(invoiceRoutes, { prefix: '/api/invoices' });
  await fastify.register(vendorRoutes, { prefix: '/api/vendors' });
  await fastify.register(calendarRoutes, { prefix: '/api/calendar' });
  await fastify.register(campaignRoutes, { prefix: '/api/campaigns' });
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  await fastify.register(fileRoutes, { prefix: '/api/files' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    app.log.info(`🚀 Server running on http://localhost:${config.server.port}`);
    app.log.info(`📚 API docs available at http://localhost:${config.server.port}/docs`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

if (require.main === module) {
  start();
}