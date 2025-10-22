import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

async function start() {
  try {
    await app.listen({ port: 4000, host: '0.0.0.0' });
    app.log.info('API running on 4000');
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
