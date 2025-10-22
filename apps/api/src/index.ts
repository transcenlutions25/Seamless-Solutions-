import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { organizationRoutes } from './routes/organizations';
import { contactRoutes } from './routes/contacts';
import { leadRoutes } from './routes/leads';
import { bidRoutes } from './routes/bids';
import { quoteRoutes } from './routes/quotes';
import { jobRoutes } from './routes/jobs';
import { invoiceRoutes } from './routes/invoices';
import { appointmentRoutes } from './routes/appointments';
import { campaignRoutes } from './routes/campaigns';
import { vendorRoutes } from './routes/vendors';
import { propertyRoutes } from './routes/properties';
import { activityRoutes } from './routes/activities';
import { authMiddleware } from './middleware/auth';
import { organizationMiddleware } from './middleware/organization';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';

// Initialize Prisma and Redis
export const prisma = new PrismaClient();
export const redis = new Redis(config.redis.url);

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'warn' : 'info',
    transport: config.nodeEnv === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register plugins
async function registerPlugins() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs
  });

  // JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Seamless Solutions API',
        description: 'API for Seamless Solutions platform',
        version: '1.0.0'
      },
      servers: [
        {
          url: config.api.url,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
}

// Register middleware
async function registerMiddleware() {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', organizationMiddleware);
  fastify.setErrorHandler(errorHandler);
}

// Register routes
async function registerRoutes() {
  // Public routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  
  // Protected routes
  await fastify.register(organizationRoutes, { prefix: '/api/organizations' });
  await fastify.register(contactRoutes, { prefix: '/api/contacts' });
  await fastify.register(leadRoutes, { prefix: '/api/leads' });
  await fastify.register(bidRoutes, { prefix: '/api/bids' });
  await fastify.register(quoteRoutes, { prefix: '/api/quotes' });
  await fastify.register(jobRoutes, { prefix: '/api/jobs' });
  await fastify.register(invoiceRoutes, { prefix: '/api/invoices' });
  await fastify.register(appointmentRoutes, { prefix: '/api/appointments' });
  await fastify.register(campaignRoutes, { prefix: '/api/campaigns' });
  await fastify.register(vendorRoutes, { prefix: '/api/vendors' });
  await fastify.register(propertyRoutes, { prefix: '/api/properties' });
  await fastify.register(activityRoutes, { prefix: '/api/activities' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Starting graceful shutdown...');
  
  try {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerMiddleware();
    await registerRoutes();
    
    await fastify.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });
    
    logger.info(`Server listening on port ${config.port}`);
    logger.info(`API documentation available at ${config.api.url}/docs`);
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server
start();
