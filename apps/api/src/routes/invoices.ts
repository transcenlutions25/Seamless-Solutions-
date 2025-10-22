import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { InvoiceStatus, Role, JobStatus } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/generators';
import Stripe from 'stripe';
import { config } from '../config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

const createInvoiceSchema = z.object({
  jobId: z.string(),
  tax: z.number().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  tax: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const createPaymentIntentSchema = z.object({
  invoiceId: z.string(),
  returnUrl: z.string().url(),
});

export async function invoiceRoutes(fastify: FastifyInstance) {
  // Get all invoices for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        status: z.nativeEnum(InvoiceStatus).optional(),
        contactId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, contactId, page, limit, search } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (status) {
      where.status = status;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
        { job: { jobNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          contact: true,
          job: {
            include: {
              quote: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    reply.send({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single invoice
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        job: {
          include: {
            quote: {
              include: {
                bid: true,
              },
            },
            property: true,
          },
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

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    reply.send({ invoice });
  });

  // Get invoice by invoice number (public access for client viewing)
  fastify.get('/public/:invoiceNumber', async (request, reply) => {
    const { invoiceNumber } = request.params as { invoiceNumber: string };

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        contact: true,
        job: {
          include: {
            quote: {
              include: {
                bid: true,
              },
            },
            property: true,
          },
        },
        org: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    reply.send({ invoice });
  });

  // Create invoice from completed job
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createInvoiceSchema,
    },
  }, async (request, reply) => {
    const data = createInvoiceSchema.parse(request.body);

    // Verify job exists and is completed
    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        orgId: request.user!.orgId,
        status: JobStatus.COMPLETED,
      },
      include: {
        contact: true,
        quote: true,
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Completed job not found' });
    }

    // Check if invoice already exists for this job
    const existingInvoice = await prisma.invoice.findUnique({
      where: { jobId: data.jobId },
    });

    if (existingInvoice) {
      return reply.status(409).send({ error: 'Invoice already exists for this job' });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx, request.user!.orgId);
      const totalAmount = job.totalAmount + data.tax;

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          jobId: data.jobId,
          contactId: job.contactId,
          amount: job.totalAmount,
          tax: data.tax,
          totalAmount,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          notes: data.notes,
          orgId: request.user!.orgId,
        },
        include: {
          contact: true,
          job: {
            include: {
              quote: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'invoice_created',
          entity: 'Invoice',
          entityId: created.id,
          userId: request.user!.id,
          invoiceId: created.id,
          contactId: job.contactId,
          jobId: data.jobId,
          details: {
            invoiceNumber,
            totalAmount,
            tax: data.tax,
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({ invoice });
  });

  // Update invoice
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateInvoiceSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateInvoiceSchema.parse(request.body);

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingInvoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    // Check if invoice can be modified
    if (existingInvoice.status === InvoiceStatus.PAID) {
      return reply.status(400).send({ error: 'Cannot modify paid invoice' });
    }

    const updateData: any = {
      ...data,
    };

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    // Recalculate total if tax changed
    if (data.tax !== undefined) {
      updateData.totalAmount = existingInvoice.amount + data.tax;
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          contact: true,
          job: {
            include: {
              quote: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'invoice_updated',
          entity: 'Invoice',
          entityId: id,
          userId: request.user!.id,
          invoiceId: id,
          contactId: updated.contactId,
          details: {
            changes: data,
            previousStatus: existingInvoice.status,
            newStatus: data.status,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ invoice });
  });

  // Create Stripe payment intent
  fastify.post('/payment-intent', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createPaymentIntentSchema,
    },
  }, async (request, reply) => {
    const { invoiceId, returnUrl } = createPaymentIntentSchema.parse(request.body);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        org: true,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return reply.status(400).send({ error: 'Invoice is already paid' });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orgId: invoice.orgId,
        },
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.org.name}`,
        receipt_email: invoice.contact.email || undefined,
      });

      // Update invoice with payment intent ID
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      reply.send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to create payment intent');
      reply.status(500).send({ error: 'Failed to create payment intent' });
    }
  });

  // Send invoice via email
  fastify.post('/:id/send', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        job: {
          include: {
            property: true,
          },
        },
        org: true,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    if (!invoice.contact.email) {
      return reply.status(400).send({ error: 'Contact has no email address' });
    }

    try {
      // In production, you would send the actual email here
      // await sendInvoiceEmail(invoice);

      // Update invoice status
      const updatedInvoice = await prisma.$transaction(async (tx) => {
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            status: InvoiceStatus.SENT,
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            action: 'invoice_sent',
            entity: 'Invoice',
            entityId: id,
            userId: request.user!.id,
            invoiceId: id,
            contactId: invoice.contactId,
            details: {
              sentTo: invoice.contact.email,
              sentAt: new Date(),
              invoiceNumber: invoice.invoiceNumber,
            },
            orgId: request.user!.orgId,
          },
        });

        return updated;
      });

      reply.send({ 
        invoice: updatedInvoice,
        message: 'Invoice sent successfully',
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to send invoice email');
      reply.status(500).send({ error: 'Failed to send invoice' });
    }
  });

  // Mark invoice as paid (manual)
  fastify.post('/:id/mark-paid', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return reply.status(400).send({ error: 'Invoice is already paid' });
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
        include: {
          contact: true,
          job: true,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'invoice_paid',
          entity: 'Invoice',
          entityId: id,
          userId: request.user!.id,
          invoiceId: id,
          contactId: invoice.contactId,
          details: {
            paidAt: new Date(),
            amount: invoice.totalAmount,
            paymentMethod: 'manual',
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ 
      invoice: updatedInvoice,
      message: 'Invoice marked as paid',
    });
  });

  // Delete invoice
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return reply.status(400).send({ 
        error: 'Cannot delete paid invoice' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Log activity before deletion
      await tx.activityLog.create({
        data: {
          action: 'invoice_deleted',
          entity: 'Invoice',
          entityId: id,
          userId: request.user!.id,
          invoiceId: id,
          contactId: invoice.contactId,
          details: {
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
          },
          orgId: request.user!.orgId,
        },
      });

      await tx.invoice.delete({
        where: { id },
      });
    });

    reply.status(204).send();
  });
}