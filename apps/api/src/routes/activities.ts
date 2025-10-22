import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export async function activityRoutes(fastify: FastifyInstance) {
  // Get activities
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        action: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Activities'],
      summary: 'Get activities with pagination'
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

      if (query.entityType) {
        where.entityType = query.entityType;
      }

      if (query.entityId) {
        where.entityId = query.entityId;
      }

      if (query.action) {
        where.action = query.action;
      }

      const [activities, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
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
        prisma.activityLog.count({ where })
      ]);

      return reply.send({
        data: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get activities error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving activities'
      });
    }
  });

  // Get activity by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Activities'],
      summary: 'Get activity by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const activity = await prisma.activityLog.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!activity) {
        return reply.status(404).send({
          error: 'Activity not found',
          message: 'The specified activity was not found'
        });
      }

      return reply.send(activity);
    } catch (error) {
      fastify.log.error('Get activity error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the activity'
      });
    }
  });
}
