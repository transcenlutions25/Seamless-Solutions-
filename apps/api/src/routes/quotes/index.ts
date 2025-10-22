import { FastifyPluginAsync } from 'fastify';
import { createQuoteSchema } from '@seamless/shared';
import { prisma } from '../../lib/prisma';
import { PDFGenerator } from '../../services/pdfGenerator';
import { nanoid } from 'nanoid';

const quotesRoutes: FastifyPluginAsync = async (fastify) => {
  const pdfGenerator = new PDFGenerator();
  
  // Create quote
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: createQuoteSchema,
    },
  }, async (request, reply) => {
    const input = request.body as any;
    
    try {
      // Generate quote number
      const count = await prisma.quote.count({
        where: { orgId: request.orgId },
      });
      const quoteNumber = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
      
      // Calculate totals
      const lineItems = input.lineItems.map((item: any) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      
      const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
      const total = subtotal - (input.discount || 0) + (input.tax || 0);
      
      // Create quote
      const quote = await prisma.quote.create({
        data: {
          orgId: request.orgId!,
          contactId: input.contactId,
          propertyId: input.propertyId,
          bidId: input.bidId,
          createdById: request.user!.userId,
          quoteNumber,
          status: 'DRAFT',
          validUntil: new Date(Date.now() + (input.validDays || 30) * 24 * 60 * 60 * 1000),
          subtotal,
          tax: input.tax || 0,
          discount: input.discount || 0,
          total,
          terms: input.terms,
          notes: input.notes,
          lineItems: {
            create: lineItems.map((item: any, index: number) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sortOrder: index,
            })),
          },
        },
        include: {
          lineItems: true,
          contact: true,
          property: true,
        },
      });
      
      // Update lead status if linked
      if (input.bidId) {
        const bid = await prisma.bid.findUnique({
          where: { id: input.bidId },
          select: { leadId: true },
        });
        
        if (bid?.leadId) {
          await prisma.lead.update({
            where: { id: bid.leadId },
            data: { status: 'QUOTED' },
          });
        }
      }
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'CREATE',
          entityType: 'Quote',
          entityId: quote.id,
          description: `Created quote ${quoteNumber} for $${total.toFixed(2)}`,
          metadata: {
            quoteNumber,
            total,
            contactId: input.contactId,
          },
        },
      });
      
      return reply.send({
        success: true,
        data: quote,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create quote' });
    }
  });
  
  // Get all quotes
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { status, contactId, page = 1, limit = 50 } = request.query as any;
    
    try {
      const where = {
        orgId: request.orgId,
        ...(status && { status }),
        ...(contactId && { contactId }),
      };
      
      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          include: {
            contact: true,
            property: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.quote.count({ where }),
      ]);
      
      return reply.send({
        success: true,
        data: {
          items: quotes,
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get quotes' });
    }
  });
  
  // Get single quote
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          contact: true,
          property: true,
          bid: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          jobs: true,
        },
      });
      
      if (!quote) {
        return reply.code(404).send({ error: 'Quote not found' });
      }
      
      return reply.send({
        success: true,
        data: quote,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get quote' });
    }
  });
  
  // Send quote to client
  fastify.post('/:id/send', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { email, message } = request.body as any;
    
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
        include: {
          contact: true,
          property: true,
          org: true,
          lineItems: true,
        },
      });
      
      if (!quote) {
        return reply.code(404).send({ error: 'Quote not found' });
      }
      
      // Update quote status
      await prisma.quote.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      
      // TODO: Send email with quote PDF attachment
      // This would integrate with Resend or SendGrid
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'EMAIL_SENT',
          entityType: 'Quote',
          entityId: id,
          description: `Quote ${quote.quoteNumber} sent to ${email || quote.contact.email}`,
          metadata: {
            recipient: email || quote.contact.email,
            message,
          },
        },
      });
      
      return reply.send({
        success: true,
        message: 'Quote sent successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to send quote' });
    }
  });
  
  // Generate quote PDF
  fastify.get('/:id/pdf', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
        include: {
          contact: true,
          property: true,
          org: true,
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      
      if (!quote) {
        return reply.code(404).send({ error: 'Quote not found' });
      }
      
      // Generate PDF
      const pdfData = {
        quoteNumber: quote.quoteNumber,
        date: quote.createdAt,
        validUntil: quote.validUntil,
        company: {
          name: quote.org.name,
          address: quote.org.address || undefined,
          city: quote.org.city || undefined,
          state: quote.org.state || undefined,
          zip: quote.org.zip || undefined,
          phone: quote.org.phone || undefined,
          email: quote.org.email || undefined,
          logoUrl: quote.org.logoUrl || undefined,
        },
        client: {
          name: `${quote.contact.firstName} ${quote.contact.lastName}`,
          company: quote.contact.company || undefined,
          address: quote.contact.address || undefined,
          city: quote.contact.city || undefined,
          state: quote.contact.state || undefined,
          zip: quote.contact.zip || undefined,
          email: quote.contact.email || undefined,
          phone: quote.contact.phone || undefined,
        },
        property: quote.property ? {
          address: quote.property.address,
          city: quote.property.city,
          state: quote.property.state,
          zip: quote.property.zip,
        } : undefined,
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        terms: quote.terms || undefined,
        notes: quote.notes || undefined,
      };
      
      const pdfBuffer = await pdfGenerator.generateQuote(pdfData);
      
      // Mark as viewed if first time
      if (!quote.viewedAt) {
        await prisma.quote.update({
          where: { id },
          data: { viewedAt: new Date() },
        });
      }
      
      reply.type('application/pdf');
      reply.header('Content-Disposition', `attachment; filename="quote-${quote.quoteNumber}.pdf"`);
      return reply.send(pdfBuffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate PDF' });
    }
  });
  
  // Accept quote
  fastify.post('/:id/accept', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
      });
      
      if (!quote) {
        return reply.code(404).send({ error: 'Quote not found' });
      }
      
      if (quote.status === 'ACCEPTED') {
        return reply.code(400).send({ error: 'Quote already accepted' });
      }
      
      // Update quote
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
      
      // Create job from quote
      const jobCount = await prisma.job.count({
        where: { orgId: request.orgId },
      });
      const jobNumber = `J-${new Date().getFullYear()}-${String(jobCount + 1).padStart(5, '0')}`;
      
      const job = await prisma.job.create({
        data: {
          orgId: request.orgId!,
          contactId: quote.contactId,
          propertyId: quote.propertyId,
          quoteId: quote.id,
          jobNumber,
          status: 'SCHEDULED',
          description: `Job from quote ${quote.quoteNumber}`,
          scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          scheduledEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'STATUS_CHANGE',
          entityType: 'Quote',
          entityId: id,
          description: `Quote ${quote.quoteNumber} accepted - Job ${jobNumber} created`,
          metadata: {
            jobId: job.id,
            jobNumber,
          },
        },
      });
      
      return reply.send({
        success: true,
        data: {
          quote: updatedQuote,
          job,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to accept quote' });
    }
  });
  
  // Reject quote
  fastify.post('/:id/reject', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
      });
      
      if (!quote) {
        return reply.code(404).send({ error: 'Quote not found' });
      }
      
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'STATUS_CHANGE',
          entityType: 'Quote',
          entityId: id,
          description: `Quote ${quote.quoteNumber} rejected`,
          metadata: { reason },
        },
      });
      
      return reply.send({
        success: true,
        data: updatedQuote,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to reject quote' });
    }
  });
};

export default quotesRoutes;