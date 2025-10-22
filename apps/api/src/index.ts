import Fastify, { FastifyInstance } from 'fastify';

const app: FastifyInstance = Fastify({ 
  logger: true 
});

// Health check endpoint
app.get('/health', async () => {
  return { ok: true, timestamp: new Date().toISOString() };
});

// Start server
const start = async (): Promise<void> => {
  try {
    await app.listen({ port: 4000, host: '0.0.0.0' });
    console.log('API running on port 4000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
