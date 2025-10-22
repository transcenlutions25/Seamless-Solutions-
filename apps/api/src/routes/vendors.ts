import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createVendorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  hourlyRate: z.number().positive().optional()
});

const updateVendorSchema = createVendorSchema.partial();

export async function vendorRoutes(fastify: FastifyInstance) {
  // Create vendor
  fastify.post('/', {
    schema: {
      body: createVendorSchema,
      tags: ['Vendors'],
      summary: 'Create a new vendor'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createVendorSchema>;

    try {
      const vendor = await prisma.vendor.create({
        data: body,
        include: {
          jobs: true,
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'VENDOR_CREATED',
        'Vendor',
        vendor.id,
        request
      );

      return reply.status(201).send(vendor);
    } catch (error) {
      fastify.log.error('Vendor creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the vendor'
      });
    }
  });

  // Get vendors
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Vendors'],
      summary: 'Get vendors with pagination'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const query = request.query as any;

    try {
      const page = Math.max(1, query.page);
      const limit = Math.min(100, Math.max(1, query.limit));
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { company: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          include: {
            jobs: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.vendor.count({ where })
      ]);

      return reply.send({
        data: vendors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get vendors error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving vendors'
      });
    }
  });

  // Get vendor by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Vendors'],
      summary: 'Get vendor by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id },
        include: {
          jobs: {
            include: {
              contact: true,
              property: true
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

      if (!vendor) {
        return reply.status(404).send({
          error: 'Vendor not found',
          message: 'The specified vendor was not found'
        });
      }

      return reply.send(vendor);
    } catch (error) {
      fastify.log.error('Get vendor error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the vendor'
      });
    }
  });

  // Update vendor
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateVendorSchema,
      tags: ['Vendors'],
      summary: 'Update vendor'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof createVendorSchema>>;

    try {
      // Verify vendor exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { id }
      });

      if (!existingVendor) {
        return reply.status(404).send({
          error: 'Vendor not found',
          message: 'The specified vendor was not found'
        });
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: body,
        include: {
          jobs: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'VENDOR_UPDATED',
        'Vendor',
        vendor.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(vendor);
    } catch (error) {
      fastify.log.error('Vendor update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the vendor'
      });
    }
  });

  // Delete vendor
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Vendors'],
      summary: 'Delete vendor'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify vendor exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { id }
      });

      if (!existingVendor) {
        return reply.status(404).send({
          error: 'Vendor not found',
          message: 'The specified vendor was not found'
        });
      }

      await prisma.vendor.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'VENDOR_DELETED',
        'Vendor',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Vendor deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the vendor'
      });
    }
  });
}
