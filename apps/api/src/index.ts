import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from './config';
import { logger } from './lib/logger';

// Plugins
import authPlugin from './plugins/auth';
import tracingPlugin from './plugins/tracing';

// Routes
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import leadsRoutes from './routes/leads';
import quotesRoutes from './routes/quotes';

const app = Fastify({
  logger,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true,
});

async function bootstrap() {
  try {
    // Register security plugins
    await app.register(helmet, {
      contentSecurityPolicy: false,
    });
    
    await app.register(cors, {
      origin: config.cors.origin,
      credentials: true,
    });
    
    await app.register(rateLimit, {
      global: true,
      max: config.rateLimit.global.max,
      timeWindow: config.rateLimit.global.timeWindow,
    });
    
    await app.register(sensible);
    
    // Register custom plugins
    await app.register(tracingPlugin);
    await app.register(authPlugin);
    
    // Register Swagger
    await app.register(swagger, {
      swagger: {
        info: {
          title: 'Seamless Solutions API',
          description: 'API for Seamless Solutions platform',
          version: '1.0.0',
        },
        host: `localhost:${config.api.port}`,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
        security: [{ Bearer: [] }],
      },
    });
    
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
    
    // Health check
    app.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });
    
    // Register routes
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(aiRoutes, { prefix: '/ai' });
    await app.register(leadsRoutes, { prefix: '/leads' });
    await app.register(quotesRoutes, { prefix: '/quotes' });
    
    // Error handler
    app.setErrorHandler((error, request, reply) => {
      request.log.error(error);
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        return reply.code(409).send({
          error: 'Duplicate entry',
          message: 'A record with this value already exists',
        });
      }
      
      if (error.code === 'P2025') {
        return reply.code(404).send({
          error: 'Not found',
          message: 'The requested resource was not found',
        });
      }
      
      // Handle validation errors
      if (error.validation) {
        return reply.code(400).send({
          error: 'Validation failed',
          message: error.message,
          validation: error.validation,
        });
      }
      
      // Handle JWT errors
      if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'No authorization header found',
        });
      }
      
      if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }
      
      // Default error
      return reply.code(error.statusCode || 500).send({
        error: 'Internal server error',
        message: config.isDev ? error.message : 'Something went wrong',
      });
    });
    
    // Graceful shutdown
    const closeGracefully = async (signal: string) => {
      app.log.info(`Received signal ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    };
    
    process.on('SIGINT', () => closeGracefully('SIGINT'));
    process.on('SIGTERM', () => closeGracefully('SIGTERM'));
    
    // Start server
    await app.listen({
      port: config.api.port,
      host: config.api.host,
    });
    
    app.log.info(`🚀 Server running at http://${config.api.host}:${config.api.port}`);
    app.log.info(`📚 API docs available at http://${config.api.host}:${config.api.port}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

bootstrap();