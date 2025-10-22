import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createQuoteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  leadId: z.string().cuid().optional(),
  bidId: z.string().cuid().optional()
});

const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional()
});

export async function quoteRoutes(fastify: FastifyInstance) {
  // Create quote
  fastify.post('/', {
    schema: {
      body: createQuoteSchema,
      tags: ['Quotes'],
      summary: 'Create a new quote'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createQuoteSchema>;

    try {
      const total = body.subtotal + body.tax - body.discount;

      const quote = await prisma.quote.create({
        data: {
          ...body,
          total,
          organizationId: request.organizationId!,
          createdById: request.user?.id
        },
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          },
          bid: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          jobs: true,
          invoices: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'QUOTE_CREATED',
        'Quote',
        quote.id,
        request,
        { total }
      );

      return reply.status(201).send(quote);
    } catch (error) {
      fastify.log.error('Quote creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the quote'
      });
    }
  });

  // Get quotes
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        status: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Quotes'],
      summary: 'Get quotes with pagination'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const query = request.query as any;

    try {
      const page = Math.max(1, query.page);
      const limit = Math.min(100, Math.max(1, query.limit));
      const skip = (page - 1) * limit;

      const where: any = {
        organizationId: request.organizationId
      };

      if (query.status) {
        where.status = query.status;
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          include: {
            lead: {
              include: {
                contact: true,
                property: true
              }
            },
            bid: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            jobs: true,
            invoices: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.quote.count({ where })
      ]);

      return reply.send({
        data: quotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get quotes error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving quotes'
      });
    }
  });

  // Get quote by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Quotes'],
      summary: 'Get quote by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          },
          bid: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          jobs: true,
          invoices: true,
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!quote) {
        return reply.status(404).send({
          error: 'Quote not found',
          message: 'The specified quote was not found'
        });
      }

      return reply.send(quote);
    } catch (error) {
      fastify.log.error('Get quote error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the quote'
      });
    }
  });

  // Update quote
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateQuoteSchema,
      tags: ['Quotes'],
      summary: 'Update quote'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof updateQuoteSchema>>;

    try {
      // Verify quote exists and belongs to organization
      const existingQuote = await prisma.quote.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingQuote) {
        return reply.status(404).send({
          error: 'Quote not found',
          message: 'The specified quote was not found'
        });
      }

      // Recalculate total if financial fields are updated
      let updateData: any = { ...body };
      if (body.subtotal !== undefined || body.tax !== undefined || body.discount !== undefined) {
        const subtotal = body.subtotal ?? existingQuote.subtotal;
        const tax = body.tax ?? existingQuote.tax;
        const discount = body.discount ?? existingQuote.discount;
        updateData.total = subtotal + tax - discount;
      }

      const quote = await prisma.quote.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            include: {
              contact: true,
              property: true
            }
          },
          bid: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          jobs: true,
          invoices: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'QUOTE_UPDATED',
        'Quote',
        quote.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(quote);
    } catch (error) {
      fastify.log.error('Quote update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the quote'
      });
    }
  });

  // Delete quote
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Quotes'],
      summary: 'Delete quote'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify quote exists and belongs to organization
      const existingQuote = await prisma.quote.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingQuote) {
        return reply.status(404).send({
          error: 'Quote not found',
          message: 'The specified quote was not found'
        });
      }

      await prisma.quote.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'QUOTE_DELETED',
        'Quote',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Quote deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the quote'
      });
    }
  });
}
