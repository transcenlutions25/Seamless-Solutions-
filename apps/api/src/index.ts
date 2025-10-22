import Fastify from 'fastify';
import cors from 'cors';
import helmet from 'helmet';

const app = Fastify({ 
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  }
});

// Security middleware
app.register(require('@fastify/helmet'), {
  contentSecurityPolicy: false
});

// CORS
app.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
});

// Health check endpoint
app.get('/health', async () => ({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development'
}));

// API routes
app.get('/api/status', async () => ({ 
  status: 'running',
  version: '1.0.0'
}));

// Error handling
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const port = parseInt(process.env.PORT || '4000');
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`API server running on ${address}`);
});
