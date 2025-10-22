import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function quoteJobRoutes(app: FastifyInstance) {
  app.post('/quotes/:id/accept', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const orgId = request.orgId!;
    const quote = await app.prisma.quote.findFirst({ where: { id: params.id, orgId } });
    if (!quote) return reply.code(404).send({ error: 'Quote not found' });

    await app.prisma.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } });

    const job = await app.prisma.job.create({ data: { orgId, quoteId: quote.id } });
    return { job };
  });

  app.patch('/jobs/:id/status', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) }).parse(request.body);
    const orgId = request.orgId!;

    const job = await app.prisma.job.update({ where: { id: params.id }, data: { status: body.status } });
    if (job.orgId !== orgId) return reply.code(403).send({ error: 'Forbidden' });
    return job;
  });
}
