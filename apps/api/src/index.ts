import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

app
  .listen({ port, host })
  .then(() => {
    console.log(`API running on ${host}:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
