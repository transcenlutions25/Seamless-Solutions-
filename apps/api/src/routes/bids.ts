import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createBidSchema = z.object({
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  sqft: z.number().positive(),
  rooms: z.number().positive(),
  daysTarget: z.number().positive().default(7),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).default('STANDARD'),
  deepClean: z.boolean().default(false),
  pestControl: z.boolean().default(false),
  flooringRepair: z.boolean().default(false),
  lawnCare: z.boolean().default(false),
  maintenance: z.boolean().default(false),
  deodorize: z.boolean().default(false),
  paintTouch: z.boolean().default(false),
});

/**
 * AI Bid Calculator - Heuristic pricing logic
 * Ready for LLM integration
 */
function calculateBid(input: z.infer<typeof createBidSchema>) {
  // Base pricing per sqft by tier
  const tierPricing = {
    BASIC: 1.5,
    STANDARD: 2.5,
    PREMIUM: 4.0,
    LUXURY: 6.0,
  };

  let basePrice = input.sqft * tierPricing[input.tier];

  // Room complexity factor
  basePrice += input.rooms * 50;

  // Scope add-ons
  if (input.deepClean) basePrice += input.sqft * 0.5;
  if (input.pestControl) basePrice += 300;
  if (input.flooringRepair) basePrice += input.sqft * 1.2;
  if (input.lawnCare) basePrice += 250;
  if (input.maintenance) basePrice += 400;
  if (input.deodorize) basePrice += 150;
  if (input.paintTouch) basePrice += input.rooms * 75;

  // Rush multiplier (< 5 days = rush)
  const rushMultiplier = input.daysTarget < 5 ? 1.3 : 1.0;

  // Risk factor (larger jobs = higher risk buffer)
  const riskFactor = input.sqft > 3000 ? 1.15 : 1.05;

  // Overhead (fixed + variable)
  const overhead = 200 + basePrice * 0.1;

  // Margin (20%)
  const margin = basePrice * 0.2;

  // Total
  const totalPrice = (basePrice * rushMultiplier * riskFactor) + overhead + margin;

  return {
    basePrice: new Decimal(basePrice.toFixed(2)),
    rushMultiplier: new Decimal(rushMultiplier.toFixed(2)),
    riskFactor: new Decimal(riskFactor.toFixed(2)),
    overhead: new Decimal(overhead.toFixed(2)),
    margin: new Decimal(margin.toFixed(2)),
    totalPrice: new Decimal(totalPrice.toFixed(2)),
  };
}

export async function bidRoutes(fastify: FastifyInstance) {
  // Calculate bid
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createBidSchema.parse(request.body);

    const pricing = calculateBid(body);

    const bid = await prisma.bid.create({
      data: {
        orgId,
        leadId: body.leadId,
        propertyId: body.propertyId,
        sqft: body.sqft,
        rooms: body.rooms,
        daysTarget: body.daysTarget,
        tier: body.tier,
        deepClean: body.deepClean,
        pestControl: body.pestControl,
        flooringRepair: body.flooringRepair,
        lawnCare: body.lawnCare,
        maintenance: body.maintenance,
        deodorize: body.deodorize,
        paintTouch: body.paintTouch,
        ...pricing,
        aiSuggestions: {
          recommendedTier: body.tier,
          estimatedDuration: body.daysTarget,
          notes: 'AI suggestions will be powered by LLM in future iterations',
        },
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Bid',
      entityId: bid.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { bid };
  });

  // Get bids
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const bids = await prisma.bid.findMany({
      where: { orgId },
      include: {
        lead: {
          include: { contact: true },
        },
        property: true,
        quote: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { bids };
  });

  // Get single bid
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const bid = await prisma.bid.findFirst({
      where: { id, orgId },
      include: {
        lead: { include: { contact: true } },
        property: true,
        quote: true,
      },
    });

    if (!bid) {
      return { error: 'Bid not found' };
    }

    return { bid };
  });
}
