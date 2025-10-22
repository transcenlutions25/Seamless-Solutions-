import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { addTraceId, authenticate } from './middleware/auth.js';
import { orgScope } from './middleware/orgScope.js';

// Routes
import { authRoutes } from './routes/auth.js';
import { leadRoutes } from './routes/leads.js';
import { bidRoutes } from './routes/bids.js';
import { quoteRoutes } from './routes/quotes.js';
import { jobRoutes } from './routes/jobs.js';
import { invoiceRoutes } from './routes/invoices.js';
import { vendorRoutes } from './routes/vendors.js';
import { appointmentRoutes } from './routes/appointments.js';
import { campaignRoutes } from './routes/campaigns.js';
import { analyticsRoutes } from './routes/analytics.js';

const app = Fastify({
  logger,
  requestIdLogLabel: 'traceId',
  disableRequestLogging: false,
  trustProxy: true,
});

// Security & CORS
await app.register(helmet, {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
});

await app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

// Rate limiting
await app.register(rateLimit, {
  max: parseInt(env.RATE_LIMIT_MAX),
  timeWindow: env.RATE_LIMIT_WINDOW,
});

// JWT
await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: env.JWT_EXPIRES_IN,
  },
});

// Decorators
app.decorate('authenticate', authenticate);
app.decorate('orgScope', orgScope);

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    orgScope: typeof orgScope;
  }
}

// Global hooks
app.addHook('onRequest', addTraceId);

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

// API routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(leadRoutes, { prefix: '/api/leads' });
app.register(bidRoutes, { prefix: '/api/bids' });
app.register(quoteRoutes, { prefix: '/api/quotes' });
app.register(jobRoutes, { prefix: '/api/jobs' });
app.register(invoiceRoutes, { prefix: '/api/invoices' });
app.register(vendorRoutes, { prefix: '/api/vendors' });
app.register(appointmentRoutes, { prefix: '/api/appointments' });
app.register(campaignRoutes, { prefix: '/api/campaigns' });
app.register(analyticsRoutes, { prefix: '/api/analytics' });

// Global error handler
app.setErrorHandler((error, request, reply) => {
  logger.error({
    err: error,
    traceId: request.traceId,
    url: request.url,
    method: request.method,
  }, 'Request error');

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.validation,
    });
  }

  // JWT errors
  if (error.message.includes('jwt') || error.message.includes('token')) {
    return reply.status(401).send({
      error: 'Invalid or expired token',
    });
  }

  // Default error
  return reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal server error',
    traceId: request.traceId,
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(env.PORT);
    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`🚀 Seamless Solutions API running on port ${port}`);
    logger.info(`📊 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
