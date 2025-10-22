import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const leadInput = z.object({
  contactId: z.string().optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'QUOTED', 'WON', 'LOST']).default('NEW'),
  source: z.enum(['EMAIL', 'SMS', 'PHONE', 'WEB', 'REFERRAL', 'OTHER']).optional(),
  notes: z.string().optional(),
});

export default async function leadRoutes(app: FastifyInstance) {
  app.post('/leads', async (request, reply) => {
    const body = leadInput.parse(request.body);
    const orgId = request.orgId!;
    const lead = await app.prisma.lead.create({ data: { ...body, orgId } });
    return lead;
  });

  app.get('/leads', async (request) => {
    const orgId = request.orgId!;
    const leads = await app.prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    return leads;
  });

  app.get('/leads/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const orgId = request.orgId!;
    const lead = await app.prisma.lead.findFirst({ where: { id: params.id, orgId } });
    if (!lead) return reply.code(404).send({ error: 'Lead not found' });
    return lead;
  });

  app.patch('/leads/:id/status', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({ status: z.enum(['NEW', 'QUALIFIED', 'QUOTED', 'WON', 'LOST']) })
      .parse(request.body);
    const orgId = request.orgId!;
    const lead = await app.prisma.lead.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    if (lead.orgId !== orgId) return reply.code(403).send({ error: 'Forbidden' });
    return lead;
  });

  app.post('/leads/:id/convert', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const orgId = request.orgId!;
    const lead = await app.prisma.lead.findFirst({ where: { id: params.id, orgId } });
    if (!lead) return reply.code(404).send({ error: 'Lead not found' });

    const contact = await app.prisma.contact.create({
      data: { orgId, type: 'PERSON' },
    });

    const updated = await app.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'QUALIFIED', contactId: contact.id },
    });

    return { lead: updated, contact };
  });
}
