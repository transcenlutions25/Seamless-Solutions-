import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

// Use async start to handle errors properly
async function start() {
  try {
    await app.listen({ port: 4000, host: '0.0.0.0' });
    console.log('API running on 4000');
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
