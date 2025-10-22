import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['LEAD', 'CLIENT', 'VENDOR', 'INTERNAL']).default('LEAD'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
});

const updateContactSchema = createContactSchema.partial();

export async function contactRoutes(fastify: FastifyInstance) {
  // Create contact
  fastify.post('/', {
    schema: {
      body: createContactSchema,
      tags: ['Contacts'],
      summary: 'Create a new contact'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createContactSchema>;

    try {
      const contact = await prisma.contact.create({
        data: {
          ...body,
          organizationId: request.organizationId!
        },
        include: {
          leads: true,
          properties: true,
          jobs: true,
          invoices: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CONTACT_CREATED',
        'Contact',
        contact.id,
        request
      );

      return reply.status(201).send(contact);
    } catch (error) {
      fastify.log.error('Contact creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the contact'
      });
    }
  });

  // Get contacts
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        type: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Contacts'],
      summary: 'Get contacts with pagination'
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

      if (query.type) {
        where.type = query.type;
      }

      if (query.search) {
        where.OR = [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { company: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          include: {
            leads: true,
            properties: true,
            jobs: true,
            invoices: true
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.contact.count({ where })
      ]);

      return reply.send({
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get contacts error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving contacts'
      });
    }
  });

  // Get contact by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Contacts'],
      summary: 'Get contact by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const contact = await prisma.contact.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          leads: true,
          properties: true,
          jobs: true,
          invoices: true,
          appointments: true
        }
      });

      if (!contact) {
        return reply.status(404).send({
          error: 'Contact not found',
          message: 'The specified contact was not found'
        });
      }

      return reply.send(contact);
    } catch (error) {
      fastify.log.error('Get contact error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the contact'
      });
    }
  });

  // Update contact
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateContactSchema,
      tags: ['Contacts'],
      summary: 'Update contact'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof createContactSchema>>;

    try {
      // Verify contact exists and belongs to organization
      const existingContact = await prisma.contact.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingContact) {
        return reply.status(404).send({
          error: 'Contact not found',
          message: 'The specified contact was not found'
        });
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: body,
        include: {
          leads: true,
          properties: true,
          jobs: true,
          invoices: true
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CONTACT_UPDATED',
        'Contact',
        contact.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(contact);
    } catch (error) {
      fastify.log.error('Contact update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the contact'
      });
    }
  });

  // Delete contact
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Contacts'],
      summary: 'Delete contact'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify contact exists and belongs to organization
      const existingContact = await prisma.contact.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingContact) {
        return reply.status(404).send({
          error: 'Contact not found',
          message: 'The specified contact was not found'
        });
      }

      await prisma.contact.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'CONTACT_DELETED',
        'Contact',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Contact deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the contact'
      });
    }
  });
}
