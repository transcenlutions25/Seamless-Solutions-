import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createInvoiceSchema = z.object({
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  contactId: z.string().cuid().optional(),
  quoteId: z.string().cuid().optional(),
  jobId: z.string().cuid().optional()
});

const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional()
});

export async function invoiceRoutes(fastify: FastifyInstance) {
  // Create invoice
  fastify.post('/', {
    schema: {
      body: createInvoiceSchema,
      tags: ['Invoices'],
      summary: 'Create a new invoice'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createInvoiceSchema>;

    try {
      const total = body.subtotal + body.tax - body.discount;
      
      // Generate invoice number
      const invoiceCount = await prisma.invoice.count({
        where: { organizationId: request.organizationId }
      });
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          ...body,
          total,
          invoiceNumber,
          organizationId: request.organizationId!,
          createdById: request.user?.id
        },
        include: {
          contact: true,
          quote: true,
          job: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'INVOICE_CREATED',
        'Invoice',
        invoice.id,
        request,
        { total, invoiceNumber }
      );

      return reply.status(201).send(invoice);
    } catch (error) {
      fastify.log.error('Invoice creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the invoice'
      });
    }
  });

  // Get invoices
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        status: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      }),
      tags: ['Invoices'],
      summary: 'Get invoices with pagination'
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

      if (query.status) {
        where.status = query.status;
      }

      if (query.search) {
        where.OR = [
          { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            contact: true,
            quote: true,
            job: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            [query.sortBy]: query.sortOrder
          },
          skip,
          take: limit
        }),
        prisma.invoice.count({ where })
      ]);

      return reply.send({
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get invoices error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving invoices'
      });
    }
  });

  // Get invoice by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Invoices'],
      summary: 'Get invoice by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          contact: true,
          quote: true,
          job: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          activities: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!invoice) {
        return reply.status(404).send({
          error: 'Invoice not found',
          message: 'The specified invoice was not found'
        });
      }

      return reply.send(invoice);
    } catch (error) {
      fastify.log.error('Get invoice error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the invoice'
      });
    }
  });

  // Update invoice
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateInvoiceSchema,
      tags: ['Invoices'],
      summary: 'Update invoice'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof updateInvoiceSchema>>;

    try {
      // Verify invoice exists and belongs to organization
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingInvoice) {
        return reply.status(404).send({
          error: 'Invoice not found',
          message: 'The specified invoice was not found'
        });
      }

      // Recalculate total if financial fields are updated
      let updateData: any = { ...body };
      if (body.subtotal !== undefined || body.tax !== undefined || body.discount !== undefined) {
        const subtotal = body.subtotal ?? existingInvoice.subtotal;
        const tax = body.tax ?? existingInvoice.tax;
        const discount = body.discount ?? existingInvoice.discount;
        updateData.total = subtotal + tax - discount;
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          contact: true,
          quote: true,
          job: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'INVOICE_UPDATED',
        'Invoice',
        invoice.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(invoice);
    } catch (error) {
      fastify.log.error('Invoice update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the invoice'
      });
    }
  });

  // Delete invoice
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Invoices'],
      summary: 'Delete invoice'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify invoice exists and belongs to organization
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingInvoice) {
        return reply.status(404).send({
          error: 'Invoice not found',
          message: 'The specified invoice was not found'
        });
      }

      await prisma.invoice.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'INVOICE_DELETED',
        'Invoice',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Invoice deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the invoice'
      });
    }
  });
}
