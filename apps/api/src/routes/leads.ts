import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createLeadSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  priority: z.number().min(1).max(5).default(3),
});

const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST']).optional(),
  assignedToId: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
});

export async function leadRoutes(fastify: FastifyInstance) {
  // Public lead submission form
  fastify.post('/public', async (request, reply) => {
    const body = createLeadSchema.parse(request.body);

    // Get org from subdomain or default
    // For demo, using a default org - in production, derive from request
    const org = await prisma.organization.findFirst();

    if (!org) {
      return reply.status(400).send({ error: 'Organization not found' });
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        orgId: org.id,
        type: 'LEAD',
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        company: body.company,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
      },
    });

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        orgId: org.id,
        contactId: contact.id,
        status: 'NEW',
        source: body.source || 'Website',
        priority: body.priority,
        description: body.description,
      },
    });

    await logActivity({
      orgId: org.id,
      entityType: 'Lead',
      entityId: lead.id,
      action: 'create_public',
      traceId: request.traceId,
    });

    return { success: true, leadId: lead.id };
  });

  // Get all leads (Kanban view)
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const leads = await prisma.lead.findMany({
      where: { orgId },
      include: {
        contact: true,
        property: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    // Group by status for Kanban
    const kanban = {
      NEW: leads.filter((l) => l.status === 'NEW'),
      CONTACTED: leads.filter((l) => l.status === 'CONTACTED'),
      QUALIFIED: leads.filter((l) => l.status === 'QUALIFIED'),
      QUOTED: leads.filter((l) => l.status === 'QUOTED'),
      WON: leads.filter((l) => l.status === 'WON'),
      LOST: leads.filter((l) => l.status === 'LOST'),
    };

    return { leads, kanban };
  });

  // Get single lead
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const lead = await prisma.lead.findFirst({
      where: { id, orgId },
      include: {
        contact: true,
        property: true,
        assignedTo: true,
        bids: true,
        quotes: true,
      },
    });

    if (!lead) {
      return { error: 'Lead not found' };
    }

    return { lead };
  });

  // Update lead
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateLeadSchema.parse(request.body);

    const lead = await prisma.lead.update({
      where: { id, orgId },
      data: body,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Lead',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { lead };
  });

  // Convert lead to client
  fastify.post('/:id/convert', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const lead = await prisma.lead.findFirst({
      where: { id, orgId },
      include: { contact: true },
    });

    if (!lead) {
      return { error: 'Lead not found' };
    }

    // Update contact type to CLIENT
    await prisma.contact.update({
      where: { id: lead.contactId! },
      data: { type: 'CLIENT' },
    });

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'WON',
        convertedToClientAt: new Date(),
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Lead',
      entityId: id,
      action: 'convert_to_client',
      traceId: request.traceId,
    });

    return { lead: updatedLead };
  });
}
