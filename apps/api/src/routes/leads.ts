import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createLeadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  value: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  contactId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional()
});

const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['NEW', 'QUALIFIED', 'QUOTED', 'WON', 'LOST']).optional()
});

export async function leadRoutes(fastify: FastifyInstance) {
  // Create lead
  fastify.post('/', {
    schema: {
      body: createLeadSchema,
      tags: ['Leads'],
      summary: 'Create a new lead'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createLeadSchema>;

    try {
      const lead = await prisma.lead.create({
        data: {
          ...body,
          organizationId: request.organizationId!,
          createdById: request.user?.id
        },
        include: {
          contact: true,
          property: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          bids: true,
          quotes: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'LEAD_CREATED',
        'Lead',
        lead.id,
        request
      );

      return reply.status(201).send(lead);
    } catch (error) {
      fastify.log.error('Lead creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the lead'
      });
    }
  });

  // Get leads
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Leads'],
      summary: 'Get leads with pagination'
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

      if (query.priority) {
        where.priority = query.priority;
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            contact: true,
            property: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            bids: true,
            quotes: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.lead.count({ where })
      ]);

      return reply.send({
        data: leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get leads error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving leads'
      });
    }
  });

  // Get lead by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Leads'],
      summary: 'Get lead by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          contact: true,
          property: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          bids: true,
          quotes: true,
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!lead) {
        return reply.status(404).send({
          error: 'Lead not found',
          message: 'The specified lead was not found'
        });
      }

      return reply.send(lead);
    } catch (error) {
      fastify.log.error('Get lead error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the lead'
      });
    }
  });

  // Update lead
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateLeadSchema,
      tags: ['Leads'],
      summary: 'Update lead'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof updateLeadSchema>>;

    try {
      // Verify lead exists and belongs to organization
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingLead) {
        return reply.status(404).send({
          error: 'Lead not found',
          message: 'The specified lead was not found'
        });
      }

      const lead = await prisma.lead.update({
        where: { id },
        data: body,
        include: {
          contact: true,
          property: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          bids: true,
          quotes: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'LEAD_UPDATED',
        'Lead',
        lead.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(lead);
    } catch (error) {
      fastify.log.error('Lead update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the lead'
      });
    }
  });

  // Delete lead
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Leads'],
      summary: 'Delete lead'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify lead exists and belongs to organization
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingLead) {
        return reply.status(404).send({
          error: 'Lead not found',
          message: 'The specified lead was not found'
        });
      }

      await prisma.lead.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'LEAD_DELETED',
        'Lead',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Lead deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the lead'
      });
    }
  });
}
