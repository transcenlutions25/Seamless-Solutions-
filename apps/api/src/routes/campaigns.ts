import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createCampaignSchema = z.object({
  name: z.string(),
  channel: z.enum(['EMAIL', 'SMS', 'BOTH']).default('EMAIL'),
  subject: z.string().optional(),
  message: z.string(),
  filters: z.object({
    contactType: z.array(z.enum(['LEAD', 'CLIENT', 'VENDOR', 'PARTNER'])).optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().optional(),
  }).optional(),
  scheduledFor: z.string().optional(),
});

const updateCampaignSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  name: z.string().optional(),
  message: z.string().optional(),
  scheduledFor: z.string().optional(),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Create campaign
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createCampaignSchema.parse(request.body);

    // Count recipients based on filters
    const whereClause: any = { orgId };
    if (body.filters?.contactType) {
      whereClause.type = { in: body.filters.contactType };
    }
    if (body.filters?.tags && body.filters.tags.length > 0) {
      whereClause.tags = { hasSome: body.filters.tags };
    }

    const recipientCount = await prisma.contact.count({ where: whereClause });

    const campaign = await prisma.campaign.create({
      data: {
        orgId,
        name: body.name,
        channel: body.channel,
        subject: body.subject,
        message: body.message,
        filters: body.filters,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        recipientCount,
        status: body.scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Campaign',
      entityId: campaign.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { campaign };
  });

  // Get campaigns
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const campaigns = await prisma.campaign.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return { campaigns };
  });

  // Get single campaign
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const campaign = await prisma.campaign.findFirst({
      where: { id, orgId },
    });

    if (!campaign) {
      return { error: 'Campaign not found' };
    }

    return { campaign };
  });

  // Update campaign
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateCampaignSchema.parse(request.body);

    const updateData: any = { ...body };
    if (body.scheduledFor) updateData.scheduledFor = new Date(body.scheduledFor);

    const campaign = await prisma.campaign.update({
      where: { id, orgId },
      data: updateData,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Campaign',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { campaign };
  });

  // Send campaign
  fastify.post('/:id/send', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const campaign = await prisma.campaign.findFirst({
      where: { id, orgId },
    });

    if (!campaign) {
      return { error: 'Campaign not found' };
    }

    // Get recipients
    const whereClause: any = { orgId };
    const filters = campaign.filters as any;
    if (filters?.contactType) {
      whereClause.type = { in: filters.contactType };
    }
    if (filters?.tags && filters.tags.length > 0) {
      whereClause.tags = { hasSome: filters.tags };
    }

    const recipients = await prisma.contact.findMany({
      where: whereClause,
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    // TODO: Send emails/SMS via Resend/Twilio
    // For now, just mark as sent

    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        sentAt: new Date(),
        recipientCount: recipients.length,
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Campaign',
      entityId: id,
      action: 'send',
      traceId: request.traceId,
    });

    return { campaign, recipientsSent: recipients.length };
  });
}
