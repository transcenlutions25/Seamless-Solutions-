import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const bidInput = z.object({
  leadId: z.string(),
  sqft: z.number().int().positive(),
  rooms: z.number().int().positive(),
  daysTarget: z.number().int().positive(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  deepClean: z.boolean().optional().default(false),
  pest: z.boolean().optional().default(false),
  flooring: z.boolean().optional().default(false),
  lawn: z.boolean().optional().default(false),
  maintenance: z.boolean().optional().default(false),
  deodorize: z.boolean().optional().default(false),
});

function computeBid(input: z.infer<typeof bidInput>) {
  const baseRatePerSqft = input.tier === 'BASIC' ? 0.8 : input.tier === 'STANDARD' ? 1.1 : 1.6;
  const roomAdder = input.rooms * 15;
  const scopeAdder =
    (input.deepClean ? 60 : 0) +
    (input.pest ? 80 : 0) +
    (input.flooring ? 100 : 0) +
    (input.lawn ? 50 : 0) +
    (input.maintenance ? 40 : 0) +
    (input.deodorize ? 25 : 0);

  const base = input.sqft * baseRatePerSqft + roomAdder + scopeAdder;
  const rushMultiplier = Math.max(1, 14 / input.daysTarget);
  const risk = base * 0.05;
  const overhead = base * 0.12;
  const margin = base * 0.2;
  const total = Math.round((base * rushMultiplier + risk + overhead + margin) * 100) / 100;

  return { base, rushMultiplier, risk, overhead, margin, total };
}

export default async function aiBidRoutes(app: FastifyInstance) {
  app.post('/ai/bid', async (request, reply) => {
    const orgId = request.orgId!;
    const body = bidInput.parse(request.body);

    const lead = await app.prisma.lead.findFirst({ where: { id: body.leadId, orgId } });
    if (!lead) return reply.code(404).send({ error: 'Lead not found' });

    const computed = computeBid(body);

    const bid = await app.prisma.bid.create({
      data: {
        orgId,
        leadId: body.leadId,
        sqft: body.sqft,
        rooms: body.rooms,
        daysTarget: body.daysTarget,
        tier: body.tier,
        deepClean: body.deepClean,
        pest: body.pest,
        flooring: body.flooring,
        lawn: body.lawn,
        maintenance: body.maintenance,
        deodorize: body.deodorize,
        base: computed.base,
        rushMultiplier: computed.rushMultiplier,
        risk: computed.risk,
        overhead: computed.overhead,
        margin: computed.margin,
        total: computed.total,
      },
    });

    const quote = await app.prisma.quote.create({
      data: { orgId, leadId: body.leadId, bidId: bid.id, total: bid.total },
    });

    await app.prisma.lead.update({ where: { id: body.leadId }, data: { status: 'QUOTED' } });

    return { bid, quote };
  });
}
