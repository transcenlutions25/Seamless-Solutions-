import Fastify from 'fastify';

const app = Fastify({ 
  logger: true 
});

app.get('/health', async () => ({ 
  ok: true,
  timestamp: new Date().toISOString()
}));

const start = async () => {
  try {
    await app.listen({ 
      port: 4000,
      host: '0.0.0.0'
    });
    console.log('API server running on http://localhost:4000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
