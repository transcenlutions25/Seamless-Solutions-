import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ 
  ok: true,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}));

const port = parseInt(process.env.API_PORT || '4000', 10);
const host = process.env.API_HOST || '0.0.0.0';

app.listen({ port, host }, (err, address) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`API server running at ${address}`);
});
