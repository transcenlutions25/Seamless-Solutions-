import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { Channel, CampaignStatus, Role, ContactType } from '@prisma/client';

const createCampaignSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(Channel),
  subject: z.string().optional(),
  content: z.string().min(1),
  filters: z.object({
    contactType: z.nativeEnum(ContactType).optional(),
    tags: z.array(z.string()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().optional(),
  content: z.string().min(1).optional(),
  filters: z.object({
    contactType: z.nativeEnum(ContactType).optional(),
    tags: z.array(z.string()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        status: z.nativeEnum(CampaignStatus).optional(),
        type: z.nativeEnum(Channel).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, type, page, limit, search } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    reply.send({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single campaign
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    reply.send({ campaign });
  });

  // Preview campaign recipients
  fastify.post('/preview-recipients', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: z.object({
        type: z.nativeEnum(Channel),
        filters: z.object({
          contactType: z.nativeEnum(ContactType).optional(),
          tags: z.array(z.string()).optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          createdAfter: z.string().datetime().optional(),
          createdBefore: z.string().datetime().optional(),
        }).optional(),
      }),
    },
  }, async (request, reply) => {
    const { type, filters } = request.body as any;

    const where: any = {
      orgId: request.user!.orgId,
      isActive: true,
    };

    // Add channel-specific filters
    if (type === Channel.EMAIL) {
      where.email = { not: null };
    } else if (type === Channel.SMS) {
      where.phone = { not: null };
    }

    // Apply user filters
    if (filters) {
      if (filters.contactType) {
        where.type = filters.contactType;
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasEvery: filters.tags,
        };
      }

      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }

      if (filters.state) {
        where.state = { contains: filters.state, mode: 'insensitive' };
      }

      if (filters.createdAfter) {
        where.createdAt = { gte: new Date(filters.createdAfter) };
      }

      if (filters.createdBefore) {
        where.createdAt = { 
          ...where.createdAt,
          lte: new Date(filters.createdBefore),
        };
      }
    }

    const [recipients, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          type: true,
          city: true,
          state: true,
          tags: true,
        },
        take: 100, // Limit preview to 100 contacts
      }),
      prisma.contact.count({ where }),
    ]);

    reply.send({
      recipients,
      total,
      preview: recipients.length,
      filters: where,
    });
  });

  // Create campaign
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createCampaignSchema,
    },
  }, async (request, reply) => {
    const data = createCampaignSchema.parse(request.body);

    // Validate subject for email campaigns
    if (data.type === Channel.EMAIL && !data.subject) {
      return reply.status(400).send({ error: 'Subject is required for email campaigns' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        filters: data.filters,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        orgId: request.user!.orgId,
      },
    });

    reply.status(201).send({ campaign });
  });

  // Update campaign
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateCampaignSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateCampaignSchema.parse(request.body);

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingCampaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    // Check if campaign can be modified
    if (existingCampaign.status === CampaignStatus.ACTIVE || existingCampaign.status === CampaignStatus.COMPLETED) {
      return reply.status(400).send({ error: 'Cannot modify active or completed campaign' });
    }

    const updateData: any = { ...data };

    if (data.scheduledAt) {
      updateData.scheduledAt = new Date(data.scheduledAt);
      // Update status to scheduled if it was draft
      if (existingCampaign.status === CampaignStatus.DRAFT) {
        updateData.status = CampaignStatus.SCHEDULED;
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    reply.send({ campaign });
  });

  // Send campaign immediately
  fastify.post('/:id/send', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return reply.status(400).send({ error: 'Campaign cannot be sent' });
    }

    // Get recipients based on filters
    const where: any = {
      orgId: request.user!.orgId,
      isActive: true,
    };

    // Add channel-specific filters
    if (campaign.type === Channel.EMAIL) {
      where.email = { not: null };
    } else if (campaign.type === Channel.SMS) {
      where.phone = { not: null };
    }

    // Apply campaign filters
    if (campaign.filters) {
      const filters = campaign.filters as any;
      
      if (filters.contactType) {
        where.type = filters.contactType;
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasEvery: filters.tags,
        };
      }

      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }

      if (filters.state) {
        where.state = { contains: filters.state, mode: 'insensitive' };
      }

      if (filters.createdAfter) {
        where.createdAt = { gte: new Date(filters.createdAfter) };
      }

      if (filters.createdBefore) {
        where.createdAt = { 
          ...where.createdAt,
          lte: new Date(filters.createdBefore),
        };
      }
    }

    const recipients = await prisma.contact.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (recipients.length === 0) {
      return reply.status(400).send({ error: 'No recipients found matching the criteria' });
    }

    try {
      // In production, you would actually send the messages here
      // For now, we'll simulate sending
      let sentCount = 0;
      let openedCount = 0;
      let clickedCount = 0;

      // Simulate sending logic
      for (const recipient of recipients) {
        if (campaign.type === Channel.EMAIL && recipient.email) {
          // await sendEmail(recipient, campaign);
          sentCount++;
          // Simulate some opens and clicks
          if (Math.random() > 0.7) openedCount++;
          if (Math.random() > 0.9) clickedCount++;
        } else if (campaign.type === Channel.SMS && recipient.phone) {
          // await sendSMS(recipient, campaign);
          sentCount++;
        }
      }

      // Update campaign with results
      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.COMPLETED,
          sentAt: new Date(),
          recipients: sentCount,
          opened: openedCount,
          clicked: clickedCount,
        },
      });

      reply.send({ 
        campaign: updatedCampaign,
        message: `Campaign sent to ${sentCount} recipients`,
        results: {
          sent: sentCount,
          opened: openedCount,
          clicked: clickedCount,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to send campaign');
      
      // Update campaign status to indicate failure
      await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.DRAFT, // Reset to draft so it can be retried
        },
      });

      reply.status(500).send({ error: 'Failed to send campaign' });
    }
  });

  // Pause campaign
  fastify.post('/:id/pause', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.ACTIVE && campaign.status !== CampaignStatus.SCHEDULED) {
      return reply.status(400).send({ error: 'Campaign cannot be paused' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });

    reply.send({ 
      campaign: updatedCampaign,
      message: 'Campaign paused',
    });
  });

  // Resume campaign
  fastify.post('/:id/resume', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.PAUSED) {
      return reply.status(400).send({ error: 'Campaign is not paused' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { 
        status: campaign.scheduledAt && campaign.scheduledAt > new Date() 
          ? CampaignStatus.SCHEDULED 
          : CampaignStatus.ACTIVE 
      },
    });

    reply.send({ 
      campaign: updatedCampaign,
      message: 'Campaign resumed',
    });
  });

  // Delete campaign
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    if (campaign.status === CampaignStatus.ACTIVE) {
      return reply.status(400).send({ 
        error: 'Cannot delete active campaign. Please pause it first.' 
      });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    reply.status(204).send();
  });

  // Get campaign analytics
  fastify.get('/:id/analytics', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    const analytics = {
      sent: campaign.recipients,
      opened: campaign.opened,
      clicked: campaign.clicked,
      openRate: campaign.recipients > 0 ? (campaign.opened / campaign.recipients) * 100 : 0,
      clickRate: campaign.recipients > 0 ? (campaign.clicked / campaign.recipients) * 100 : 0,
      clickThroughRate: campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0,
    };

    reply.send({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        sentAt: campaign.sentAt,
      },
      analytics,
    });
  });
}