import Fastify from 'fastify';
const app = Fastify({ logger: true });
app.get('/health', async () => ({ ok: true }));
app.listen({ port: 4000 }, () => console.log('API running on 4000'));
