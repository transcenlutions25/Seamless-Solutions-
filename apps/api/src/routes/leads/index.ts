import { FastifyPluginAsync } from 'fastify';
import { createLeadSchema, updateLeadStatusSchema } from '@seamless/shared';
import { prisma } from '../../lib/prisma';
import { nanoid } from 'nanoid';

const leadsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public lead capture form (no auth required)
  fastify.post('/capture', {
    schema: {
      body: createLeadSchema,
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const input = request.body as any;
    
    try {
      // Simple spam protection - check for recent submissions from same IP
      const recentSubmissions = await prisma.activityLog.count({
        where: {
          ipAddress: request.ip,
          type: 'CREATE',
          entityType: 'Lead',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });
      
      if (recentSubmissions >= 3) {
        return reply.code(429).send({ error: 'Too many submissions. Please try again later.' });
      }
      
      // Find org by subdomain from referer or default
      const referer = request.headers.referer || request.headers.origin || '';
      let orgId: string | undefined;
      
      // Extract subdomain from URL
      const subdomainMatch = referer.match(/\/\/([^.]+)\./);
      if (subdomainMatch) {
        const org = await prisma.org.findUnique({
          where: { subdomain: subdomainMatch[1] },
        });
        orgId = org?.id;
      }
      
      // If no org found, use default or first org (for demo)
      if (!orgId) {
        const defaultOrg = await prisma.org.findFirst();
        orgId = defaultOrg?.id;
      }
      
      if (!orgId) {
        return reply.code(400).send({ error: 'Organization not found' });
      }
      
      // Create or find contact
      let contact = await prisma.contact.findFirst({
        where: {
          orgId,
          email: input.email,
        },
      });
      
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            orgId,
            type: 'LEAD',
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            company: input.company,
            address: input.address,
            city: input.city,
            state: input.state,
            zip: input.zip,
            source: input.source || 'Website',
          },
        });
      }
      
      // Create lead
      const lead = await prisma.lead.create({
        data: {
          orgId,
          contactId: contact.id,
          status: 'NEW',
          source: input.source || 'Website',
          notes: input.notes,
          score: 50, // Default score
        },
      });
      
      // Create property if address provided
      if (input.address) {
        await prisma.propertyOrSite.create({
          data: {
            orgId,
            contactId: contact.id,
            name: `${input.firstName} ${input.lastName} Property`,
            address: input.address,
            city: input.city || '',
            state: input.state || '',
            zip: input.zip || '',
            squareFeet: input.squareFeet,
            rooms: input.rooms,
          },
        });
      }
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId,
          type: 'CREATE',
          entityType: 'Lead',
          entityId: lead.id,
          description: `New lead: ${input.firstName} ${input.lastName}`,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: {
            source: input.source || 'Website',
            email: input.email,
          },
        },
      });
      
      return reply.send({
        success: true,
        message: 'Thank you for your interest! We will contact you soon.',
        data: {
          leadId: lead.id,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to submit lead' });
    }
  });
  
  // Get all leads (auth required)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { status, page = 1, limit = 50 } = request.query as any;
    
    try {
      const where = {
        orgId: request.orgId,
        ...(status && { status }),
      };
      
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            contact: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.lead.count({ where }),
      ]);
      
      return reply.send({
        success: true,
        data: {
          items: leads,
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get leads' });
    }
  });
  
  // Get single lead
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
        include: {
          contact: true,
          bids: {
            orderBy: { createdAt: 'desc' },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      
      if (!lead) {
        return reply.code(404).send({ error: 'Lead not found' });
      }
      
      return reply.send({
        success: true,
        data: lead,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get lead' });
    }
  });
  
  // Update lead status
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate],
    schema: {
      body: updateLeadStatusSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, lostReason } = request.body as any;
    
    try {
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
      });
      
      if (!lead) {
        return reply.code(404).send({ error: 'Lead not found' });
      }
      
      // Update lead
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          status,
          lostReason,
          ...(status === 'WON' && { convertedAt: new Date() }),
        },
      });
      
      // Update contact type if converting to client
      if (status === 'WON' && lead.contactId) {
        await prisma.contact.update({
          where: { id: lead.contactId },
          data: { type: 'CLIENT' },
        });
      }
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'STATUS_CHANGE',
          entityType: 'Lead',
          entityId: id,
          description: `Lead status changed from ${lead.status} to ${status}`,
          metadata: {
            oldStatus: lead.status,
            newStatus: status,
            lostReason,
          },
        },
      });
      
      return reply.send({
        success: true,
        data: updatedLead,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update lead status' });
    }
  });
  
  // Add note to lead
  fastify.post('/:id/notes', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { note } = request.body as any;
    
    try {
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
      });
      
      if (!lead) {
        return reply.code(404).send({ error: 'Lead not found' });
      }
      
      // Append note
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          notes: lead.notes ? `${lead.notes}\n\n${new Date().toISOString()}: ${note}` : note,
        },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'NOTE_ADDED',
          entityType: 'Lead',
          entityId: id,
          description: 'Added note to lead',
          metadata: { note },
        },
      });
      
      return reply.send({
        success: true,
        data: updatedLead,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to add note' });
    }
  });
  
  // Get pipeline statistics
  fastify.get('/stats/pipeline', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const stats = await prisma.lead.groupBy({
        by: ['status'],
        where: { orgId: request.orgId },
        _count: { status: true },
      });
      
      const pipeline = {
        NEW: 0,
        CONTACTED: 0,
        QUALIFIED: 0,
        QUOTED: 0,
        WON: 0,
        LOST: 0,
        ARCHIVED: 0,
      };
      
      stats.forEach(stat => {
        pipeline[stat.status as keyof typeof pipeline] = stat._count.status;
      });
      
      const total = Object.values(pipeline).reduce((sum, count) => sum + count, 0);
      const conversionRate = total > 0 ? (pipeline.WON / total) * 100 : 0;
      
      return reply.send({
        success: true,
        data: {
          pipeline,
          total,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get pipeline stats' });
    }
  });
};

export default leadsRoutes;