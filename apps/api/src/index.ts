import Fastify from 'fastify';

async function start() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));

  const port = Number(process.env.PORT) || 4000;
  const address = await app.listen({ port });
  app.log.info(`API running on ${address}`);
}

start().catch((error) => {
  // Ensure startup errors cause a non-zero exit for container orchestration
  console.error(error);
  process.exit(1);
});
