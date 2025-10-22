import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  logo: z.string().url().optional(),
  settings: z.record(z.any()).optional()
});

export async function organizationRoutes(fastify: FastifyInstance) {
  // Get organization
  fastify.get('/', {
    tags: ['Organizations'],
    summary: 'Get current organization'
  }, async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.organizationId) {
      return reply.status(404).send({
        error: 'Organization not found',
        message: 'No organization found for this user'
      });
    }

    try {
      const organization = await prisma.organization.findUnique({
        where: { id: request.organizationId },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              createdAt: true
            }
          }
        }
      });

      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found',
          message: 'Organization not found'
        });
      }

      return reply.send(organization);
    } catch (error) {
      fastify.log.error('Get organization error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the organization'
      });
    }
  });

  // Update organization
  fastify.put('/', {
    schema: {
      body: updateOrganizationSchema,
      tags: ['Organizations'],
      summary: 'Update organization'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.organizationId) {
      return reply.status(404).send({
        error: 'Organization not found',
        message: 'No organization found for this user'
      });
    }

    const body = request.body as z.infer<typeof updateOrganizationSchema>;

    try {
      const organization = await prisma.organization.update({
        where: { id: request.organizationId },
        data: body,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              createdAt: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'ORGANIZATION_UPDATED',
        'Organization',
        organization.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(organization);
    } catch (error) {
      fastify.log.error('Update organization error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the organization'
      });
    }
  });

  // Get organization stats
  fastify.get('/stats', {
    tags: ['Organizations'],
    summary: 'Get organization statistics'
  }, async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.organizationId) {
      return reply.status(404).send({
        error: 'Organization not found',
        message: 'No organization found for this user'
      });
    }

    try {
      const [
        totalLeads,
        totalContacts,
        totalJobs,
        totalInvoices,
        activeLeads,
        completedJobs,
        paidInvoices
      ] = await Promise.all([
        prisma.lead.count({
          where: { organizationId: request.organizationId }
        }),
        prisma.contact.count({
          where: { organizationId: request.organizationId }
        }),
        prisma.job.count({
          where: { organizationId: request.organizationId }
        }),
        prisma.invoice.count({
          where: { organizationId: request.organizationId }
        }),
        prisma.lead.count({
          where: { 
            organizationId: request.organizationId,
            status: { in: ['NEW', 'QUALIFIED', 'QUOTED'] }
          }
        }),
        prisma.job.count({
          where: { 
            organizationId: request.organizationId,
            status: 'COMPLETED'
          }
        }),
        prisma.invoice.count({
          where: { 
            organizationId: request.organizationId,
            status: 'PAID'
          }
        })
      ]);

      return reply.send({
        leads: {
          total: totalLeads,
          active: activeLeads
        },
        contacts: {
          total: totalContacts
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices
        }
      });
    } catch (error) {
      fastify.log.error('Get organization stats error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving organization statistics'
      });
    }
  });
}
