import { FastifyPluginAsync } from 'fastify';
import { createBidSchema } from '@seamless/shared';
import { prisma } from '../../lib/prisma';
import { BidCalculator } from '../../services/bidCalculator';
import { nanoid } from 'nanoid';

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Calculate bid
  fastify.post('/bid', {
    preHandler: [fastify.authenticate],
    schema: {
      body: createBidSchema,
    },
  }, async (request, reply) => {
    const input = request.body as any;
    const { orgId } = request;
    
    try {
      // Get org's price multiplier
      const org = await prisma.org.findUnique({
        where: { id: orgId },
        select: { priceMultiplier: true },
      });
      
      // Initialize calculator with org's multiplier
      const calculator = new BidCalculator(org?.priceMultiplier || 1.0);
      
      // Calculate bid
      const result = await calculator.calculateWithAI(input);
      
      // Get suggestions
      const suggestions = calculator.getSuggestions(result);
      
      // Save bid to database
      const bid = await prisma.bid.create({
        data: {
          orgId: orgId!,
          leadId: input.leadId,
          propertyId: input.propertyId,
          squareFeet: input.squareFeet,
          rooms: input.rooms,
          bathrooms: input.bathrooms || 1,
          daysTarget: input.daysTarget,
          tier: input.tier,
          deepClean: input.deepClean || false,
          pestControl: input.pestControl || false,
          flooringRepair: input.flooringRepair || false,
          lawnCare: input.lawnCare || false,
          maintenance: input.maintenance || false,
          deodorize: input.deodorize || false,
          basePrice: result.basePrice,
          rushMultiplier: result.rushMultiplier,
          riskFactor: result.riskFactor,
          overhead: result.overhead,
          margin: result.margin,
          totalPrice: result.totalPrice,
          notes: input.notes,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: orgId!,
          userId: request.user?.userId,
          type: 'CREATE',
          entityType: 'Bid',
          entityId: bid.id,
          description: `Calculated bid for $${result.totalPrice}`,
          metadata: {
            tier: input.tier,
            squareFeet: input.squareFeet,
            totalPrice: result.totalPrice,
          },
        },
      });
      
      return reply.send({
        success: true,
        data: {
          bid: {
            id: bid.id,
            ...result,
          },
          suggestions,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to calculate bid' });
    }
  });
  
  // Get bid by ID
  fastify.get('/bid/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const bid = await prisma.bid.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
        include: {
          lead: true,
          property: true,
          quote: true,
        },
      });
      
      if (!bid) {
        return reply.code(404).send({ error: 'Bid not found' });
      }
      
      return reply.send({
        success: true,
        data: bid,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get bid' });
    }
  });
  
  // Recalculate bid with updated parameters
  fastify.post('/bid/:id/recalculate', {
    preHandler: [fastify.authenticate],
    schema: {
      body: createBidSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const input = request.body as any;
    
    try {
      // Get existing bid
      const existingBid = await prisma.bid.findFirst({
        where: {
          id,
          orgId: request.orgId,
        },
      });
      
      if (!existingBid) {
        return reply.code(404).send({ error: 'Bid not found' });
      }
      
      // Get org's price multiplier
      const org = await prisma.org.findUnique({
        where: { id: request.orgId },
        select: { priceMultiplier: true },
      });
      
      // Recalculate
      const calculator = new BidCalculator(org?.priceMultiplier || 1.0);
      const result = await calculator.calculateWithAI(input);
      const suggestions = calculator.getSuggestions(result);
      
      // Update bid
      const updatedBid = await prisma.bid.update({
        where: { id },
        data: {
          squareFeet: input.squareFeet,
          rooms: input.rooms,
          bathrooms: input.bathrooms || 1,
          daysTarget: input.daysTarget,
          tier: input.tier,
          deepClean: input.deepClean || false,
          pestControl: input.pestControl || false,
          flooringRepair: input.flooringRepair || false,
          lawnCare: input.lawnCare || false,
          maintenance: input.maintenance || false,
          deodorize: input.deodorize || false,
          basePrice: result.basePrice,
          rushMultiplier: result.rushMultiplier,
          riskFactor: result.riskFactor,
          overhead: result.overhead,
          margin: result.margin,
          totalPrice: result.totalPrice,
          notes: input.notes,
        },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: request.orgId!,
          userId: request.user?.userId,
          type: 'UPDATE',
          entityType: 'Bid',
          entityId: id,
          description: `Recalculated bid - new price: $${result.totalPrice}`,
          metadata: {
            oldPrice: existingBid.totalPrice,
            newPrice: result.totalPrice,
          },
        },
      });
      
      return reply.send({
        success: true,
        data: {
          bid: {
            ...updatedBid,
            ...result,
          },
          suggestions,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to recalculate bid' });
    }
  });
  
  // Auto-tune price multiplier based on conversion data
  fastify.post('/tune-pricing', {
    preHandler: [fastify.authenticate, fastify.authorize(['OWNER', 'STAFF'])],
  }, async (request, reply) => {
    try {
      // Get recent quote conversion data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const quotes = await prisma.quote.findMany({
        where: {
          orgId: request.orgId,
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          bid: true,
        },
      });
      
      const totalQuotes = quotes.length;
      const wonQuotes = quotes.filter(q => q.status === 'ACCEPTED').length;
      const conversionRate = totalQuotes > 0 ? wonQuotes / totalQuotes : 0;
      
      // Calculate average prices
      const avgQuotePrice = quotes.reduce((sum, q) => sum + q.total, 0) / (totalQuotes || 1);
      const wonQuotesAvg = quotes
        .filter(q => q.status === 'ACCEPTED')
        .reduce((sum, q) => sum + q.total, 0) / (wonQuotes || 1);
      
      // Determine multiplier adjustment
      let newMultiplier = 1.0;
      let reason = 'No adjustment needed';
      
      if (conversionRate < 0.15 && totalQuotes >= 10) {
        // Low conversion, prices might be too high
        newMultiplier = 0.95;
        reason = 'Low conversion rate - reducing prices by 5%';
      } else if (conversionRate > 0.4 && avgQuotePrice < 1000) {
        // High conversion with low prices, room to increase
        newMultiplier = 1.05;
        reason = 'High conversion rate with low average price - increasing by 5%';
      } else if (conversionRate > 0.5 && totalQuotes >= 10) {
        // Very high conversion, definitely room to increase
        newMultiplier = 1.1;
        reason = 'Very high conversion rate - increasing prices by 10%';
      }
      
      // Get current multiplier
      const org = await prisma.org.findUnique({
        where: { id: request.orgId },
        select: { priceMultiplier: true },
      });
      
      const currentMultiplier = org?.priceMultiplier || 1.0;
      const adjustedMultiplier = Math.round(currentMultiplier * newMultiplier * 100) / 100;
      
      // Update org multiplier
      if (newMultiplier !== 1.0) {
        await prisma.org.update({
          where: { id: request.orgId },
          data: { priceMultiplier: adjustedMultiplier },
        });
      }
      
      return reply.send({
        success: true,
        data: {
          analysis: {
            totalQuotes,
            wonQuotes,
            conversionRate: Math.round(conversionRate * 100),
            avgQuotePrice: Math.round(avgQuotePrice),
            wonQuotesAvg: Math.round(wonQuotesAvg),
          },
          adjustment: {
            currentMultiplier,
            newMultiplier: adjustedMultiplier,
            reason,
            applied: newMultiplier !== 1.0,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to tune pricing' });
    }
  });
};

export default aiRoutes;