import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createInvoiceSchema = z.object({
  jobId: z.string().optional(),
  contactId: z.string().optional(),
  lineItems: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  tax: z.number().default(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}

export async function invoiceRoutes(fastify: FastifyInstance) {
  // Create invoice
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createInvoiceSchema.parse(request.body);

    const subtotal = body.lineItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + body.tax;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        jobId: body.jobId,
        contactId: body.contactId,
        invoiceNumber,
        lineItems: body.lineItems,
        subtotal: new Decimal(subtotal.toFixed(2)),
        tax: new Decimal(body.tax.toFixed(2)),
        total: new Decimal(total.toFixed(2)),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
        status: 'DRAFT',
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { invoice };
  });

  // Get invoices
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const invoices = await prisma.invoice.findMany({
      where: { orgId },
      include: {
        job: true,
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { invoices };
  });

  // Get single invoice
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const invoice = await prisma.invoice.findFirst({
      where: { id, orgId },
      include: {
        job: true,
        contact: true,
      },
    });

    if (!invoice) {
      return { error: 'Invoice not found' };
    }

    return { invoice };
  });

  // Update invoice
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateInvoiceSchema.parse(request.body);

    const invoice = await prisma.invoice.update({
      where: { id, orgId },
      data: body,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Invoice',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { invoice };
  });

  // Send invoice
  fastify.post('/:id/send', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const invoice = await prisma.invoice.update({
      where: { id, orgId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // TODO: Send email with invoice PDF and payment link

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Invoice',
      entityId: id,
      action: 'send',
      traceId: request.traceId,
    });

    return { invoice };
  });

  // Mark paid
  fastify.post('/:id/mark-paid', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const invoice = await prisma.invoice.findFirst({
      where: { id, orgId },
    });

    if (!invoice) {
      return { error: 'Invoice not found' };
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        amountPaid: invoice.total,
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Invoice',
      entityId: id,
      action: 'mark_paid',
      traceId: request.traceId,
    });

    return { invoice: updatedInvoice };
  });

  // Stripe webhook handler
  fastify.post('/webhook/stripe', async (request, reply) => {
    // TODO: Verify Stripe signature
    const event = request.body as any;

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Find invoice by Stripe payment intent ID
      const invoice = await prisma.invoice.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            amountPaid: new Decimal(paymentIntent.amount / 100), // Convert from cents
          },
        });

        await logActivity({
          orgId: invoice.orgId,
          entityType: 'Invoice',
          entityId: invoice.id,
          action: 'paid_via_stripe',
          traceId: request.traceId,
        });
      }
    }

    return { received: true };
  });
}
