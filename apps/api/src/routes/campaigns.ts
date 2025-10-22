import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'SMS', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL']),
  subject: z.string().optional(),
  content: z.string().optional(),
  targetAudience: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional()
});

const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional()
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Create campaign
  fastify.post('/', {
    schema: {
      body: createCampaignSchema,
      tags: ['Campaigns'],
      summary: 'Create a new campaign'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createCampaignSchema>;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          ...body,
          organizationId: request.organizationId!,
          createdById: request.user?.id
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CAMPAIGN_CREATED',
        'Campaign',
        campaign.id,
        request
      );

      return reply.status(201).send(campaign);
    } catch (error) {
      fastify.log.error('Campaign creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the campaign'
      });
    }
  });

  // Get campaigns
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Campaigns'],
      summary: 'Get campaigns with pagination'
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

      if (query.type) {
        where.type = query.type;
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.campaign.count({ where })
      ]);

      return reply.send({
        data: campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get campaigns error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving campaigns'
      });
    }
  });

  // Get campaign by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Campaigns'],
      summary: 'Get campaign by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!campaign) {
        return reply.status(404).send({
          error: 'Campaign not found',
          message: 'The specified campaign was not found'
        });
      }

      return reply.send(campaign);
    } catch (error) {
      fastify.log.error('Get campaign error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the campaign'
      });
    }
  });

  // Update campaign
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateCampaignSchema,
      tags: ['Campaigns'],
      summary: 'Update campaign'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof updateCampaignSchema>>;

    try {
      // Verify campaign exists and belongs to organization
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingCampaign) {
        return reply.status(404).send({
          error: 'Campaign not found',
          message: 'The specified campaign was not found'
        });
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: body,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CAMPAIGN_UPDATED',
        'Campaign',
        campaign.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(campaign);
    } catch (error) {
      fastify.log.error('Campaign update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the campaign'
      });
    }
  });

  // Delete campaign
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Campaigns'],
      summary: 'Delete campaign'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify campaign exists and belongs to organization
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingCampaign) {
        return reply.status(404).send({
          error: 'Campaign not found',
          message: 'The specified campaign was not found'
        });
      }

      await prisma.campaign.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CAMPAIGN_DELETED',
        'Campaign',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Campaign deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the campaign'
      });
    }
  });
}
