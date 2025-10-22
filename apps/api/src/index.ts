import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

// Export the Fastify instance for Vercel
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen({ port: 4000 }, () => console.log('API running on 4000'));
}
