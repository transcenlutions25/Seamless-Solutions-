import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { LeadStatus, ContactType, Role } from '@prisma/client';

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
  priority: z.number().min(0).max(10).default(0),
});

const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
  priority: z.number().min(0).max(10).optional(),
  assignedTo: z.string().optional(),
});

const publicLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  serviceType: z.string().min(1),
  description: z.string().min(10),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function leadRoutes(fastify: FastifyInstance) {
  // Public lead form (no auth required)
  fastify.post('/public', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: publicLeadSchema,
    },
  }, async (request, reply) => {
    const data = publicLeadSchema.parse(request.body);
    
    // Simple spam protection - check for suspicious patterns
    const suspiciousPatterns = [
      /\b(viagra|casino|lottery|winner|congratulations)\b/i,
      /\b(click here|free money|make money fast)\b/i,
      /http[s]?:\/\//i, // URLs in description
    ];
    
    const textToCheck = `${data.firstName} ${data.lastName} ${data.description}`;
    const isSpam = suspiciousPatterns.some(pattern => pattern.test(textToCheck));
    
    if (isSpam) {
      return reply.status(400).send({ error: 'Invalid submission' });
    }

    // For public leads, we'll assign them to a default organization
    // In production, you might determine the org based on subdomain or other routing
    const defaultOrg = await prisma.organization.findFirst({
      where: { isActive: true },
    });

    if (!defaultOrg) {
      return reply.status(500).send({ error: 'Service temporarily unavailable' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create or find contact
      let contact = await tx.contact.findFirst({
        where: {
          email: data.email,
          orgId: defaultOrg.id,
        },
      });

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            type: ContactType.LEAD,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            orgId: defaultOrg.id,
          },
        });
      }

      // Create property
      const property = await tx.propertyOrSite.create({
        data: {
          name: `${data.address}, ${data.city}`,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          orgId: defaultOrg.id,
        },
      });

      // Create lead
      const lead = await tx.lead.create({
        data: {
          status: LeadStatus.NEW,
          source: 'website',
          contactId: contact.id,
          propertyId: property.id,
          description: `${data.serviceType}: ${data.description}`,
          priority: data.urgency === 'high' ? 8 : data.urgency === 'medium' ? 5 : 2,
          orgId: defaultOrg.id,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'lead_created',
          entity: 'Lead',
          entityId: lead.id,
          contactId: contact.id,
          details: {
            source: 'public_form',
            serviceType: data.serviceType,
            urgency: data.urgency,
          },
          orgId: defaultOrg.id,
        },
      });

      return { lead, contact, property };
    });

    reply.status(201).send({
      message: 'Thank you! We\'ll contact you soon.',
      leadId: result.lead.id,
    });
  });

  // Get all leads for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        status: z.nativeEnum(LeadStatus).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, page, limit, search } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          contact: true,
          property: true,
          bids: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    reply.send({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single lead
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        property: true,
        bids: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    reply.send({ lead });
  });

  // Create lead
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createLeadSchema,
    },
  }, async (request, reply) => {
    const data = createLeadSchema.parse(request.body);

    const result = await prisma.$transaction(async (tx) => {
      // Create or find contact
      let contact = await tx.contact.findFirst({
        where: {
          email: data.email,
          orgId: request.user!.orgId,
        },
      });

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            type: ContactType.LEAD,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            company: data.company,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            orgId: request.user!.orgId,
          },
        });
      }

      // Create lead
      const lead = await tx.lead.create({
        data: {
          status: LeadStatus.NEW,
          source: data.source,
          contactId: contact.id,
          description: data.description,
          estimatedValue: data.estimatedValue,
          priority: data.priority,
          orgId: request.user!.orgId,
        },
        include: {
          contact: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'lead_created',
          entity: 'Lead',
          entityId: lead.id,
          userId: request.user!.id,
          contactId: contact.id,
          details: {
            source: data.source,
            estimatedValue: data.estimatedValue,
          },
          orgId: request.user!.orgId,
        },
      });

      return lead;
    });

    reply.status(201).send({ lead: result });
  });

  // Update lead
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateLeadSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateLeadSchema.parse(request.body);

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingLead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data,
        include: {
          contact: true,
          property: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'lead_updated',
          entity: 'Lead',
          entityId: id,
          userId: request.user!.id,
          leadId: id,
          details: {
            changes: data,
            previousStatus: existingLead.status,
            newStatus: data.status,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ lead });
  });

  // Convert lead to client
  fastify.post('/:id/convert', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
      },
    });

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    if (lead.status === LeadStatus.WON) {
      return reply.status(400).send({ error: 'Lead already converted' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update contact type to CLIENT
      await tx.contact.update({
        where: { id: lead.contactId },
        data: { type: ContactType.CLIENT },
      });

      // Update lead status to WON
      const updatedLead = await tx.lead.update({
        where: { id },
        data: { status: LeadStatus.WON },
        include: {
          contact: true,
          property: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'lead_converted',
          entity: 'Lead',
          entityId: id,
          userId: request.user!.id,
          leadId: id,
          contactId: lead.contactId,
          details: {
            convertedTo: 'client',
          },
          orgId: request.user!.orgId,
        },
      });

      return updatedLead;
    });

    reply.send({ lead: result });
  });

  // Delete lead
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Log activity before deletion
      await tx.activityLog.create({
        data: {
          action: 'lead_deleted',
          entity: 'Lead',
          entityId: id,
          userId: request.user!.id,
          leadId: id,
          details: {
            status: lead.status,
            description: lead.description,
          },
          orgId: request.user!.orgId,
        },
      });

      // Delete lead (cascade will handle related records)
      await tx.lead.delete({
        where: { id },
      });
    });

    reply.status(204).send();
  });
}