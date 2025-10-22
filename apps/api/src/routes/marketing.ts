import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function marketingRoutes(app: FastifyInstance) {
  app.post('/campaigns', async (request) => {
    const orgId = request.orgId!;
    const body = z
      .object({ name: z.string(), channel: z.enum(['EMAIL', 'SMS']), scheduleAt: z.string().datetime().optional(), content: z.any().optional() })
      .parse(request.body);

    const campaign = await app.prisma.campaign.create({
      data: {
        orgId,
        name: body.name,
        channel: body.channel,
        status: body.scheduleAt ? 'SCHEDULED' : 'DRAFT',
        scheduleAt: body.scheduleAt ? new Date(body.scheduleAt) : undefined,
        content: body.content ?? null,
      },
    });

    return campaign;
  });

  // Trigger: Quote sent -> SMS reminder 24h if unopened (stubbed)
  app.post('/triggers/quote-sent', async (request) => {
    const orgId = request.orgId!;
    const body = z.object({ quoteId: z.string() }).parse(request.body);

    const quote = await app.prisma.quote.findFirst({ where: { id: body.quoteId, orgId } });
    if (!quote) return { queued: false };

    // In production, enqueue a job to send reminder in 24h via provider (Twilio/Resend)
    return { queued: true, runAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  });
}
