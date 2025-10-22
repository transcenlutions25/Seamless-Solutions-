import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function billingRoutes(app: FastifyInstance) {
  // Create invoice for a job
  app.post('/jobs/:id/invoices', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const orgId = request.orgId!;
    const job = await app.prisma.job.findFirst({ where: { id: params.id, orgId } });
    if (!job) return reply.code(404).send({ error: 'Job not found' });

    const body = z.object({ amount: z.number().int().positive(), currency: z.string().default('usd') }).parse(request.body);

    const invoice = await app.prisma.invoice.create({
      data: { orgId, jobId: job.id, amount: body.amount, currency: body.currency, status: 'SENT' },
    });

    return { invoice };
  });

  // Stripe webhook stub: mark invoice paid
  app.post('/stripe/webhook', async (request, reply) => {
    // NOTE: In production, verify signature header
    const body = z
      .object({ type: z.string(), data: z.object({ object: z.object({ metadata: z.record(z.string()).optional() }).optional() }) })
      .parse(request.body ?? {});

    if (body.type === 'payment_intent.succeeded') {
      const invoiceId = body.data.object?.metadata?.invoiceId;
      if (invoiceId) {
        await app.prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
      }
    }

    return { received: true };
  });
}
