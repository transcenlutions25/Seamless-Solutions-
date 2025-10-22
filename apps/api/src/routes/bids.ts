import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { Tier, Role } from '@prisma/client';

const createBidSchema = z.object({
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  sqft: z.number().min(1),
  rooms: z.number().min(1),
  daysTarget: z.number().min(1),
  tier: z.nativeEnum(Tier),
  deepClean: z.boolean().default(false),
  pest: z.boolean().default(false),
  flooring: z.boolean().default(false),
  lawn: z.boolean().default(false),
  maintenance: z.boolean().default(false),
  deodorize: z.boolean().default(false),
  notes: z.string().optional(),
});

const calculateBidSchema = z.object({
  sqft: z.number().min(1),
  rooms: z.number().min(1),
  daysTarget: z.number().min(1),
  tier: z.nativeEnum(Tier),
  deepClean: z.boolean().default(false),
  pest: z.boolean().default(false),
  flooring: z.boolean().default(false),
  lawn: z.boolean().default(false),
  maintenance: z.boolean().default(false),
  deodorize: z.boolean().default(false),
});

interface BidCalculationParams {
  sqft: number;
  rooms: number;
  daysTarget: number;
  tier: Tier;
  deepClean: boolean;
  pest: boolean;
  flooring: boolean;
  lawn: boolean;
  maintenance: boolean;
  deodorize: boolean;
  priceMultiplier?: number;
}

function calculateBidPrice(params: BidCalculationParams): {
  basePrice: number;
  rushMultiplier: number;
  riskFactor: number;
  overhead: number;
  margin: number;
  totalPrice: number;
  breakdown: Record<string, number>;
} {
  const {
    sqft,
    rooms,
    daysTarget,
    tier,
    deepClean,
    pest,
    flooring,
    lawn,
    maintenance,
    deodorize,
    priceMultiplier = 1.0,
  } = params;

  // Base pricing per sqft by tier
  const basePricePerSqft = {
    [Tier.BASIC]: 2.5,
    [Tier.STANDARD]: 3.5,
    [Tier.PREMIUM]: 5.0,
  };

  // Room complexity multiplier
  const roomMultiplier = Math.max(1.0, 1 + (rooms - 1) * 0.1);

  // Calculate base price
  let basePrice = sqft * basePricePerSqft[tier] * roomMultiplier;

  // Service add-ons
  const addOns: Record<string, number> = {};
  
  if (deepClean) {
    addOns.deepClean = sqft * 1.2;
    basePrice += addOns.deepClean;
  }
  
  if (pest) {
    addOns.pest = Math.max(150, sqft * 0.5);
    basePrice += addOns.pest;
  }
  
  if (flooring) {
    addOns.flooring = sqft * 2.0;
    basePrice += addOns.flooring;
  }
  
  if (lawn) {
    addOns.lawn = Math.max(100, sqft * 0.3);
    basePrice += addOns.lawn;
  }
  
  if (maintenance) {
    addOns.maintenance = Math.max(200, sqft * 0.8);
    basePrice += addOns.maintenance;
  }
  
  if (deodorize) {
    addOns.deodorize = Math.max(75, sqft * 0.4);
    basePrice += addOns.deodorize;
  }

  // Rush job multiplier (less time = higher price)
  let rushMultiplier = 1.0;
  if (daysTarget <= 1) {
    rushMultiplier = 2.0;
  } else if (daysTarget <= 3) {
    rushMultiplier = 1.5;
  } else if (daysTarget <= 7) {
    rushMultiplier = 1.2;
  }

  // Risk factor based on job complexity
  const serviceCount = [deepClean, pest, flooring, lawn, maintenance, deodorize].filter(Boolean).length;
  const riskFactor = 1.0 + (serviceCount * 0.05) + (sqft > 5000 ? 0.1 : 0);

  // Apply multipliers
  basePrice *= rushMultiplier * riskFactor * priceMultiplier;

  // Calculate overhead (15% of base)
  const overhead = basePrice * 0.15;

  // Calculate margin (25% of base + overhead)
  const margin = (basePrice + overhead) * 0.25;

  // Total price
  const totalPrice = Math.round((basePrice + overhead + margin) * 100) / 100;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    rushMultiplier,
    riskFactor,
    overhead: Math.round(overhead * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    totalPrice,
    breakdown: {
      basePricePerSqft: basePricePerSqft[tier],
      roomMultiplier,
      ...addOns,
    },
  };
}

export async function bidRoutes(fastify: FastifyInstance) {
  // Calculate bid price (no auth required for estimation)
  fastify.post('/calculate', {
    schema: {
      body: calculateBidSchema,
    },
  }, async (request, reply) => {
    const params = calculateBidSchema.parse(request.body);
    
    const calculation = calculateBidPrice(params);
    
    reply.send({
      calculation,
      disclaimer: 'This is an estimate. Final pricing may vary based on site conditions and specific requirements.',
    });
  });

  // Get all bids for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        leadId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    },
  }, async (request, reply) => {
    const { leadId, page, limit } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
          property: true,
          quote: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.bid.count({ where }),
    ]);

    reply.send({
      bids,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single bid
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const bid = await prisma.bid.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        lead: {
          include: {
            contact: true,
          },
        },
        property: true,
        quote: true,
      },
    });

    if (!bid) {
      return reply.status(404).send({ error: 'Bid not found' });
    }

    reply.send({ bid });
  });

  // Create bid
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createBidSchema,
    },
  }, async (request, reply) => {
    const data = createBidSchema.parse(request.body);

    // Get organization's price multiplier
    const org = await prisma.organization.findUnique({
      where: { id: request.user!.orgId },
      select: { priceMultiplier: true },
    });

    if (!org) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    // Calculate pricing
    const calculation = calculateBidPrice({
      ...data,
      priceMultiplier: org.priceMultiplier,
    });

    const bid = await prisma.$transaction(async (tx) => {
      const created = await tx.bid.create({
        data: {
          ...data,
          basePrice: calculation.basePrice,
          rushMultiplier: calculation.rushMultiplier,
          riskFactor: calculation.riskFactor,
          overhead: calculation.overhead,
          margin: calculation.margin,
          totalPrice: calculation.totalPrice,
          orgId: request.user!.orgId,
        },
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
          property: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'bid_created',
          entity: 'Bid',
          entityId: created.id,
          userId: request.user!.id,
          leadId: data.leadId,
          details: {
            totalPrice: calculation.totalPrice,
            tier: data.tier,
            sqft: data.sqft,
            services: {
              deepClean: data.deepClean,
              pest: data.pest,
              flooring: data.flooring,
              lawn: data.lawn,
              maintenance: data.maintenance,
              deodorize: data.deodorize,
            },
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({
      bid,
      calculation: {
        breakdown: calculation.breakdown,
        disclaimer: 'This bid is valid for 30 days from creation date.',
      },
    });
  });

  // Update bid
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createBidSchema.partial(),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as Partial<typeof createBidSchema._type>;

    const existingBid = await prisma.bid.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingBid) {
      return reply.status(404).send({ error: 'Bid not found' });
    }

    // Check if bid is already used in a quote
    const quote = await prisma.quote.findUnique({
      where: { bidId: id },
    });

    if (quote) {
      return reply.status(400).send({ 
        error: 'Cannot modify bid that is already used in a quote' 
      });
    }

    // Recalculate if pricing parameters changed
    let calculation = null;
    if (data.sqft || data.rooms || data.daysTarget || data.tier || 
        data.deepClean !== undefined || data.pest !== undefined ||
        data.flooring !== undefined || data.lawn !== undefined ||
        data.maintenance !== undefined || data.deodorize !== undefined) {
      
      const org = await prisma.organization.findUnique({
        where: { id: request.user!.orgId },
        select: { priceMultiplier: true },
      });

      const updatedParams = {
        sqft: data.sqft ?? existingBid.sqft,
        rooms: data.rooms ?? existingBid.rooms,
        daysTarget: data.daysTarget ?? existingBid.daysTarget,
        tier: data.tier ?? existingBid.tier,
        deepClean: data.deepClean ?? existingBid.deepClean,
        pest: data.pest ?? existingBid.pest,
        flooring: data.flooring ?? existingBid.flooring,
        lawn: data.lawn ?? existingBid.lawn,
        maintenance: data.maintenance ?? existingBid.maintenance,
        deodorize: data.deodorize ?? existingBid.deodorize,
        priceMultiplier: org?.priceMultiplier ?? 1.0,
      };

      calculation = calculateBidPrice(updatedParams);
      
      // Update pricing fields
      Object.assign(data, {
        basePrice: calculation.basePrice,
        rushMultiplier: calculation.rushMultiplier,
        riskFactor: calculation.riskFactor,
        overhead: calculation.overhead,
        margin: calculation.margin,
        totalPrice: calculation.totalPrice,
      });
    }

    const bid = await prisma.$transaction(async (tx) => {
      const updated = await tx.bid.update({
        where: { id },
        data,
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
          property: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'bid_updated',
          entity: 'Bid',
          entityId: id,
          userId: request.user!.id,
          leadId: updated.leadId,
          details: {
            changes: data,
            newTotalPrice: updated.totalPrice,
            recalculated: calculation !== null,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ 
      bid,
      ...(calculation && {
        calculation: {
          breakdown: calculation.breakdown,
          disclaimer: 'This bid is valid for 30 days from creation date.',
        }
      }),
    });
  });

  // Delete bid
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const bid = await prisma.bid.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!bid) {
      return reply.status(404).send({ error: 'Bid not found' });
    }

    // Check if bid is used in a quote
    const quote = await prisma.quote.findUnique({
      where: { bidId: id },
    });

    if (quote) {
      return reply.status(400).send({ 
        error: 'Cannot delete bid that is used in a quote' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Log activity before deletion
      await tx.activityLog.create({
        data: {
          action: 'bid_deleted',
          entity: 'Bid',
          entityId: id,
          userId: request.user!.id,
          leadId: bid.leadId,
          details: {
            totalPrice: bid.totalPrice,
            tier: bid.tier,
            sqft: bid.sqft,
          },
          orgId: request.user!.orgId,
        },
      });

      await tx.bid.delete({
        where: { id },
      });
    });

    reply.status(204).send();
  });
}