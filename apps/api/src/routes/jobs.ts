import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  notes: z.string().optional(),
  contactId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  quoteId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional()
});

const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  actualHours: z.number().positive().optional(),
  qcPhotos: z.array(z.string()).optional()
});

export async function jobRoutes(fastify: FastifyInstance) {
  // Create job
  fastify.post('/', {
    schema: {
      body: createJobSchema,
      tags: ['Jobs'],
      summary: 'Create a new job'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createJobSchema>;

    try {
      const job = await prisma.job.create({
        data: {
          ...body,
          organizationId: request.organizationId!,
          createdById: request.user?.id
        },
        include: {
          contact: true,
          property: true,
          quote: true,
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
          vendor: true,
          invoices: true,
          appointments: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'JOB_CREATED',
        'Job',
        job.id,
        request
      );

      return reply.status(201).send(job);
    } catch (error) {
      fastify.log.error('Job creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the job'
      });
    }
  });

  // Get jobs
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
      tags: ['Jobs'],
      summary: 'Get jobs with pagination'
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

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            contact: true,
            property: true,
            quote: true,
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
            vendor: true,
            invoices: true,
            appointments: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.job.count({ where })
      ]);

      return reply.send({
        data: jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get jobs error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving jobs'
      });
    }
  });

  // Get job by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Jobs'],
      summary: 'Get job by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const job = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          contact: true,
          property: true,
          quote: true,
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
          vendor: true,
          invoices: true,
          appointments: true,
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          message: 'The specified job was not found'
        });
      }

      return reply.send(job);
    } catch (error) {
      fastify.log.error('Get job error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the job'
      });
    }
  });

  // Update job
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateJobSchema,
      tags: ['Jobs'],
      summary: 'Update job'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof updateJobSchema>>;

    try {
      // Verify job exists and belongs to organization
      const existingJob = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingJob) {
        return reply.status(404).send({
          error: 'Job not found',
          message: 'The specified job was not found'
        });
      }

      const job = await prisma.job.update({
        where: { id },
        data: body,
        include: {
          contact: true,
          property: true,
          quote: true,
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
          vendor: true,
          invoices: true,
          appointments: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'JOB_UPDATED',
        'Job',
        job.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(job);
    } catch (error) {
      fastify.log.error('Job update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the job'
      });
    }
  });

  // Delete job
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Jobs'],
      summary: 'Delete job'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify job exists and belongs to organization
      const existingJob = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingJob) {
        return reply.status(404).send({
          error: 'Job not found',
          message: 'The specified job was not found'
        });
      }

      await prisma.job.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'JOB_DELETED',
        'Job',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Job deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the job'
      });
    }
  });
}
