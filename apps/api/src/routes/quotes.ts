import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { QuoteStatus, Role } from '@prisma/client';
import { generateQuoteNumber } from '../utils/generators';
import { sendQuoteEmail } from '../services/email';

const createQuoteSchema = z.object({
  bidId: z.string(),
  contactId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

const updateQuoteSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
});

export async function quoteRoutes(fastify: FastifyInstance) {
  // Get all quotes for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        status: z.nativeEnum(QuoteStatus).optional(),
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
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          contact: true,
          bid: {
            include: {
              lead: true,
              property: true,
            },
          },
          job: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    reply.send({
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single quote
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        bid: {
          include: {
            lead: true,
            property: true,
          },
        },
        job: true,
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

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    reply.send({ quote });
  });

  // Get quote by quote number (public access for client viewing)
  fastify.get('/public/:quoteNumber', async (request, reply) => {
    const { quoteNumber } = request.params as { quoteNumber: string };

    const quote = await prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        contact: true,
        bid: {
          include: {
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

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    // Track view
    if (!quote.viewedAt) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { viewedAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'quote_viewed',
          entity: 'Quote',
          entityId: quote.id,
          quoteId: quote.id,
          contactId: quote.contactId,
          details: {
            viewedAt: new Date(),
            quoteNumber,
          },
          orgId: quote.orgId,
        },
      });
    }

    reply.send({ quote });
  });

  // Create quote
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createQuoteSchema,
    },
  }, async (request, reply) => {
    const data = createQuoteSchema.parse(request.body);

    // Verify bid exists and belongs to organization
    const bid = await prisma.bid.findFirst({
      where: {
        id: data.bidId,
        orgId: request.user!.orgId,
      },
      include: {
        lead: true,
        property: true,
      },
    });

    if (!bid) {
      return reply.status(404).send({ error: 'Bid not found' });
    }

    // Check if quote already exists for this bid
    const existingQuote = await prisma.quote.findUnique({
      where: { bidId: data.bidId },
    });

    if (existingQuote) {
      return reply.status(409).send({ error: 'Quote already exists for this bid' });
    }

    // Verify contact exists and belongs to organization
    const contact = await prisma.contact.findFirst({
      where: {
        id: data.contactId,
        orgId: request.user!.orgId,
      },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contact not found' });
    }

    const quote = await prisma.$transaction(async (tx) => {
      const quoteNumber = await generateQuoteNumber(tx, request.user!.orgId);

      const created = await tx.quote.create({
        data: {
          quoteNumber,
          bidId: data.bidId,
          contactId: data.contactId,
          title: data.title,
          description: data.description,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          totalAmount: bid.totalPrice,
          terms: data.terms,
          notes: data.notes,
          orgId: request.user!.orgId,
        },
        include: {
          contact: true,
          bid: {
            include: {
              lead: true,
              property: true,
            },
          },
        },
      });

      // Update lead status if quote is for a lead
      if (bid.leadId) {
        await tx.lead.update({
          where: { id: bid.leadId },
          data: { status: 'QUOTED' },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'quote_created',
          entity: 'Quote',
          entityId: created.id,
          userId: request.user!.id,
          quoteId: created.id,
          contactId: data.contactId,
          leadId: bid.leadId,
          details: {
            quoteNumber,
            totalAmount: bid.totalPrice,
            title: data.title,
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({ quote });
  });

  // Update quote
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateQuoteSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateQuoteSchema.parse(request.body);

    const existingQuote = await prisma.quote.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingQuote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    // Check if quote can be modified
    if (existingQuote.status === QuoteStatus.ACCEPTED && data.status !== QuoteStatus.ACCEPTED) {
      return reply.status(400).send({ error: 'Cannot modify accepted quote' });
    }

    const updateData: any = {
      ...data,
    };

    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }

    const quote = await prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id },
        data: updateData,
        include: {
          contact: true,
          bid: {
            include: {
              lead: true,
              property: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'quote_updated',
          entity: 'Quote',
          entityId: id,
          userId: request.user!.id,
          quoteId: id,
          contactId: updated.contactId,
          details: {
            changes: data,
            previousStatus: existingQuote.status,
            newStatus: data.status,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ quote });
  });

  // Send quote via email
  fastify.post('/:id/send', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        bid: {
          include: {
            property: true,
          },
        },
        org: true,
      },
    });

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    if (!quote.contact.email) {
      return reply.status(400).send({ error: 'Contact has no email address' });
    }

    if (quote.status === QuoteStatus.SENT) {
      return reply.status(400).send({ error: 'Quote already sent' });
    }

    try {
      // Send email
      await sendQuoteEmail(quote);

      // Update quote status
      const updatedQuote = await prisma.$transaction(async (tx) => {
        const updated = await tx.quote.update({
          where: { id },
          data: {
            status: QuoteStatus.SENT,
            sentAt: new Date(),
          },
          include: {
            contact: true,
            bid: {
              include: {
                property: true,
              },
            },
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            action: 'quote_sent',
            entity: 'Quote',
            entityId: id,
            userId: request.user!.id,
            quoteId: id,
            contactId: quote.contactId,
            details: {
              sentTo: quote.contact.email,
              sentAt: new Date(),
              quoteNumber: quote.quoteNumber,
            },
            orgId: request.user!.orgId,
          },
        });

        return updated;
      });

      reply.send({ 
        quote: updatedQuote,
        message: 'Quote sent successfully',
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to send quote email');
      reply.status(500).send({ error: 'Failed to send quote' });
    }
  });

  // Accept quote (public endpoint for clients)
  fastify.post('/public/:quoteNumber/accept', async (request, reply) => {
    const { quoteNumber } = request.params as { quoteNumber: string };

    const quote = await prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        bid: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    if (quote.status !== QuoteStatus.SENT) {
      return reply.status(400).send({ error: 'Quote cannot be accepted' });
    }

    // Check if quote is expired
    if (quote.validUntil && new Date() > quote.validUntil) {
      return reply.status(400).send({ error: 'Quote has expired' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.ACCEPTED },
      });

      // Update lead status if applicable
      if (quote.bid.leadId) {
        await tx.lead.update({
          where: { id: quote.bid.leadId },
          data: { status: 'WON' },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'quote_accepted',
          entity: 'Quote',
          entityId: quote.id,
          quoteId: quote.id,
          contactId: quote.contactId,
          leadId: quote.bid.leadId,
          details: {
            acceptedAt: new Date(),
            quoteNumber,
            totalAmount: quote.totalAmount,
          },
          orgId: quote.orgId,
        },
      });

      return updatedQuote;
    });

    reply.send({ 
      message: 'Quote accepted successfully',
      quote: result,
    });
  });

  // Reject quote (public endpoint for clients)
  fastify.post('/public/:quoteNumber/reject', async (request, reply) => {
    const { quoteNumber } = request.params as { quoteNumber: string };

    const quote = await prisma.quote.findUnique({
      where: { quoteNumber },
    });

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    if (quote.status !== QuoteStatus.SENT) {
      return reply.status(400).send({ error: 'Quote cannot be rejected' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.REJECTED },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'quote_rejected',
          entity: 'Quote',
          entityId: quote.id,
          quoteId: quote.id,
          contactId: quote.contactId,
          details: {
            rejectedAt: new Date(),
            quoteNumber,
          },
          orgId: quote.orgId,
        },
      });

      return updatedQuote;
    });

    reply.send({ 
      message: 'Quote rejected',
      quote: result,
    });
  });

  // Delete quote
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        job: true,
      },
    });

    if (!quote) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    if (quote.job) {
      return reply.status(400).send({ 
        error: 'Cannot delete quote that has an associated job' 
      });
    }

    if (quote.status === QuoteStatus.ACCEPTED) {
      return reply.status(400).send({ 
        error: 'Cannot delete accepted quote' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Log activity before deletion
      await tx.activityLog.create({
        data: {
          action: 'quote_deleted',
          entity: 'Quote',
          entityId: id,
          userId: request.user!.id,
          quoteId: id,
          contactId: quote.contactId,
          details: {
            quoteNumber: quote.quoteNumber,
            status: quote.status,
            totalAmount: quote.totalAmount,
          },
          orgId: request.user!.orgId,
        },
      });

      await tx.quote.delete({
        where: { id },
      });
    });

    reply.status(204).send();
  });
}