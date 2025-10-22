import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  propertyType: z.string().optional(),
  squareFootage: z.number().positive().optional(),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  notes: z.string().optional(),
  contactId: z.string().cuid().optional()
});

const updatePropertySchema = createPropertySchema.partial();

export async function propertyRoutes(fastify: FastifyInstance) {
  // Create property
  fastify.post('/', {
    schema: {
      body: createPropertySchema,
      tags: ['Properties'],
      summary: 'Create a new property'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createPropertySchema>;

    try {
      const property = await prisma.propertyOrSite.create({
        data: {
          ...body,
          organizationId: request.organizationId!
        },
        include: {
          contact: true,
          leads: true,
          jobs: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'PROPERTY_CREATED',
        'PropertyOrSite',
        property.id,
        request
      );

      return reply.status(201).send(property);
    } catch (error) {
      fastify.log.error('Property creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the property'
      });
    }
  });

  // Get properties
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Properties'],
      summary: 'Get properties with pagination'
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

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { state: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [properties, total] = await Promise.all([
        prisma.propertyOrSite.findMany({
          where,
          include: {
            contact: true,
            leads: true,
            jobs: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.propertyOrSite.count({ where })
      ]);

      return reply.send({
        data: properties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get properties error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving properties'
      });
    }
  });

  // Get property by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Properties'],
      summary: 'Get property by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const property = await prisma.propertyOrSite.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          contact: true,
          leads: true,
          jobs: true,
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!property) {
        return reply.status(404).send({
          error: 'Property not found',
          message: 'The specified property was not found'
        });
      }

      return reply.send(property);
    } catch (error) {
      fastify.log.error('Get property error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the property'
      });
    }
  });

  // Update property
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updatePropertySchema,
      tags: ['Properties'],
      summary: 'Update property'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof createPropertySchema>>;

    try {
      // Verify property exists and belongs to organization
      const existingProperty = await prisma.propertyOrSite.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingProperty) {
        return reply.status(404).send({
          error: 'Property not found',
          message: 'The specified property was not found'
        });
      }

      const property = await prisma.propertyOrSite.update({
        where: { id },
        data: body,
        include: {
          contact: true,
          leads: true,
          jobs: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'PROPERTY_UPDATED',
        'PropertyOrSite',
        property.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(property);
    } catch (error) {
      fastify.log.error('Property update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the property'
      });
    }
  });

  // Delete property
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Properties'],
      summary: 'Delete property'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify property exists and belongs to organization
      const existingProperty = await prisma.propertyOrSite.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingProperty) {
        return reply.status(404).send({
          error: 'Property not found',
          message: 'The specified property was not found'
        });
      }

      await prisma.propertyOrSite.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'PROPERTY_DELETED',
        'PropertyOrSite',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Property deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the property'
      });
    }
  });
}
