import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createQuoteSchema = z.object({
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  bidId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  lineItems: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  tax: z.number().default(0),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

const updateQuoteSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  lineItems: z.array(z.any()).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count();
  return `Q-${year}-${String(count + 1).padStart(5, '0')}`;
}

export async function quoteRoutes(fastify: FastifyInstance) {
  // Create quote
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createQuoteSchema.parse(request.body);

    const subtotal = body.lineItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + body.tax;

    const quoteNumber = await generateQuoteNumber();

    const quote = await prisma.quote.create({
      data: {
        orgId,
        leadId: body.leadId,
        contactId: body.contactId,
        bidId: body.bidId,
        quoteNumber,
        title: body.title,
        description: body.description,
        lineItems: body.lineItems,
        subtotal: new Decimal(subtotal.toFixed(2)),
        tax: new Decimal(body.tax.toFixed(2)),
        total: new Decimal(total.toFixed(2)),
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        notes: body.notes,
        terms: body.terms || 'Payment due within 30 days of acceptance.',
        status: 'DRAFT',
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Quote',
      entityId: quote.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { quote };
  });

  // Get quotes
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const quotes = await prisma.quote.findMany({
      where: { orgId },
      include: {
        lead: { include: { contact: true } },
        contact: true,
        bid: true,
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { quotes };
  });

  // Get single quote
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const quote = await prisma.quote.findFirst({
      where: { id, orgId },
      include: {
        lead: { include: { contact: true } },
        contact: true,
        bid: true,
        job: true,
      },
    });

    if (!quote) {
      return { error: 'Quote not found' };
    }

    return { quote };
  });

  // Update quote
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateQuoteSchema.parse(request.body);

    const quote = await prisma.quote.update({
      where: { id, orgId },
      data: body,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Quote',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { quote };
  });

  // Send quote
  fastify.post('/:id/send', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const quote = await prisma.quote.update({
      where: { id, orgId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // TODO: Send email with quote PDF

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Quote',
      entityId: id,
      action: 'send',
      traceId: request.traceId,
    });

    return { quote };
  });

  // Accept quote (creates job)
  fastify.post('/:id/accept', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const quote = await prisma.quote.findFirst({
      where: { id, orgId },
      include: { contact: true },
    });

    if (!quote) {
      return { error: 'Quote not found' };
    }

    const jobNumber = `J-${new Date().getFullYear()}-${String(await prisma.job.count() + 1).padStart(5, '0')}`;

    const job = await prisma.job.create({
      data: {
        orgId,
        quoteId: quote.id,
        contactId: quote.contactId,
        jobNumber,
        title: quote.title,
        description: quote.description,
        status: 'SCHEDULED',
      },
    });

    await prisma.quote.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Quote',
      entityId: id,
      action: 'accept',
      traceId: request.traceId,
    });

    return { quote, job };
  });
}
