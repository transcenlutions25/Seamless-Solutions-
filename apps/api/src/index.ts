import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { ENV, CONSTANTS, isDev } from '@seamless/config';
import { authenticate, requireRole } from './lib/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';

const app = Fastify({
  logger: isDev ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
});

// Register plugins
async function registerPlugins() {
  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: ENV.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: CONSTANTS.CORS_ORIGINS,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: CONSTANTS.RATE_LIMIT_WINDOW,
  });

  // JWT
  await app.register(jwt, {
    secret: ENV.JWT_SECRET,
    sign: {
      expiresIn: CONSTANTS.JWT_EXPIRES_IN,
    },
  });

  // Decorate fastify with auth helpers
  app.decorate('authenticate', authenticate);
  app.decorate('requireRole', requireRole);
}

// Register routes
async function registerRoutes() {
  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
}

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error({ error, url: request.url, method: request.method }, 'Request error');

  if (error.statusCode === 429) {
    return reply.code(429).send({
      success: false,
      error: 'Too many requests',
    });
  }

  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  }

  if (error.message === 'Authentication required') {
    return reply.code(401).send({
      success: false,
      error: 'Authentication required',
    });
  }

  if (error.message === 'Insufficient permissions') {
    return reply.code(403).send({
      success: false,
      error: 'Insufficient permissions',
    });
  }

  return reply.code(error.statusCode || 500).send({
    success: false,
    error: ENV.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await app.listen({
      port: ENV.PORT,
      host: '0.0.0.0',
    });

    app.log.info(`🚀 API server running on port ${ENV.PORT}`);
    app.log.info(`📝 Environment: ${ENV.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  app.log.info('Shutting down gracefully...');
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Add type declarations
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    requireRole: typeof requireRole;
  }
}

start();
