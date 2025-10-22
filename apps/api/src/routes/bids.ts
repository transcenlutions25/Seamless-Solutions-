import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest, BidCalculationInput } from '../types';
import { BidCalculator } from '../services/bidCalculator';
import { ActivityLogger } from '../services/activityLogger';

const bidCalculationSchema = z.object({
  squareFootage: z.number().positive(),
  rooms: z.number().positive().int(),
  daysTarget: z.number().positive().int(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']),
  scope: z.object({
    deepClean: z.boolean().default(false),
    pestControl: z.boolean().default(false),
    flooring: z.boolean().default(false),
    lawnCare: z.boolean().default(false),
    maintenance: z.boolean().default(false),
    deodorize: z.boolean().default(false)
  }),
  notes: z.string().optional()
});

const createBidSchema = bidCalculationSchema.extend({
  leadId: z.string().cuid()
});

const updateBidSchema = createBidSchema.partial();

export async function bidRoutes(fastify: FastifyInstance) {
  // Calculate bid (AI bid calculator)
  fastify.post('/calculate', {
    schema: {
      body: bidCalculationSchema,
      tags: ['Bids'],
      summary: 'Calculate bid using AI algorithm'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as BidCalculationInput;

    try {
      // Validate input
      const validationErrors = BidCalculator.validateInput(body);
      if (validationErrors.length > 0) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: validationErrors
        });
      }

      // Calculate bid
      const result = BidCalculator.calculateBid(body);

      return reply.send({
        calculation: result,
        input: body
      });
    } catch (error) {
      fastify.log.error('Bid calculation error:', error);
      return reply.status(500).send({
        error: 'Calculation failed',
        message: 'An error occurred while calculating the bid'
      });
    }
  });

  // Create bid
  fastify.post('/', {
    schema: {
      body: createBidSchema,
      tags: ['Bids'],
      summary: 'Create a new bid'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createBidSchema>;

    try {
      // Verify lead exists and belongs to organization
      const lead = await prisma.lead.findFirst({
        where: {
          id: body.leadId,
          organizationId: request.organizationId
        }
      });

      if (!lead) {
        return reply.status(404).send({
          error: 'Lead not found',
          message: 'The specified lead was not found'
        });
      }

      // Calculate bid
      const calculation = BidCalculator.calculateBid(body);

      // Create bid
      const bid = await prisma.bid.create({
        data: {
          squareFootage: body.squareFootage,
          rooms: body.rooms,
          daysTarget: body.daysTarget,
          tier: body.tier,
          scope: body.scope,
          basePrice: calculation.basePrice,
          rushMultiplier: calculation.rushMultiplier,
          riskFactor: calculation.riskFactor,
          overhead: calculation.overhead,
          margin: calculation.margin,
          totalPrice: calculation.totalPrice,
          notes: body.notes,
          leadId: body.leadId
        },
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'BID_CREATED',
        'Bid',
        bid.id,
        request,
        { leadId: body.leadId, totalPrice: calculation.totalPrice }
      );

      return reply.status(201).send(bid);
    } catch (error) {
      fastify.log.error('Bid creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the bid'
      });
    }
  });

  // Get bids
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        leadId: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Bids'],
      summary: 'Get bids with pagination'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const query = request.query as any;

    try {
      const page = Math.max(1, query.page);
      const limit = Math.min(100, Math.max(1, query.limit));
      const skip = (page - 1) * limit;

      const where: any = {
        lead: {
          organizationId: request.organizationId
        }
      };

      if (query.leadId) {
        where.leadId = query.leadId;
      }

      const [bids, total] = await Promise.all([
        prisma.bid.findMany({
          where,
          include: {
            lead: {
              include: {
                contact: true,
                property: true
              }
            }
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.bid.count({ where })
      ]);

      return reply.send({
        data: bids,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get bids error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving bids'
      });
    }
  });

  // Get bid by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Bids'],
      summary: 'Get bid by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const bid = await prisma.bid.findFirst({
        where: {
          id,
          lead: {
            organizationId: request.organizationId
          }
        },
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          }
        }
      });

      if (!bid) {
        return reply.status(404).send({
          error: 'Bid not found',
          message: 'The specified bid was not found'
        });
      }

      return reply.send(bid);
    } catch (error) {
      fastify.log.error('Get bid error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the bid'
      });
    }
  });

  // Update bid
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateBidSchema,
      tags: ['Bids'],
      summary: 'Update bid'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof createBidSchema>>;

    try {
      // Verify bid exists and belongs to organization
      const existingBid = await prisma.bid.findFirst({
        where: {
          id,
          lead: {
            organizationId: request.organizationId
          }
        }
      });

      if (!existingBid) {
        return reply.status(404).send({
          error: 'Bid not found',
          message: 'The specified bid was not found'
        });
      }

      // If calculation fields are updated, recalculate
      let updateData: any = { ...body };
      if (body.squareFootage || body.rooms || body.daysTarget || body.tier || body.scope) {
        const calculation = BidCalculator.calculateBid({
          squareFootage: body.squareFootage || existingBid.squareFootage,
          rooms: body.rooms || existingBid.rooms,
          daysTarget: body.daysTarget || existingBid.daysTarget,
          tier: body.tier || existingBid.tier,
          scope: body.scope || (existingBid.scope as any),
          notes: body.notes || existingBid.notes
        });

        updateData = {
          ...updateData,
          basePrice: calculation.basePrice,
          rushMultiplier: calculation.rushMultiplier,
          riskFactor: calculation.riskFactor,
          overhead: calculation.overhead,
          margin: calculation.margin,
          totalPrice: calculation.totalPrice
        };
      }

      const bid = await prisma.bid.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'BID_UPDATED',
        'Bid',
        bid.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(bid);
    } catch (error) {
      fastify.log.error('Bid update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the bid'
      });
    }
  });

  // Delete bid
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Bids'],
      summary: 'Delete bid'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify bid exists and belongs to organization
      const existingBid = await prisma.bid.findFirst({
        where: {
          id,
          lead: {
            organizationId: request.organizationId
          }
        }
      });

      if (!existingBid) {
        return reply.status(404).send({
          error: 'Bid not found',
          message: 'The specified bid was not found'
        });
      }

      await prisma.bid.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'BID_DELETED',
        'Bid',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Bid deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the bid'
      });
    }
  });
}
