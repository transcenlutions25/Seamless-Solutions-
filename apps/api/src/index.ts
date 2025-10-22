import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

app
  .listen({ port: 4000, host: '0.0.0.0' })
  .then(() => {
    console.log('API running on http://0.0.0.0:4000');
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
