import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get dashboard KPIs
  fastify.get('/dashboard', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    // Pipeline stats
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: { orgId },
      _count: true,
    });

    const pipelineStats = {
      new: leadsByStatus.find((l) => l.status === 'NEW')?._count ?? 0,
      contacted: leadsByStatus.find((l) => l.status === 'CONTACTED')?._count ?? 0,
      qualified: leadsByStatus.find((l) => l.status === 'QUALIFIED')?._count ?? 0,
      quoted: leadsByStatus.find((l) => l.status === 'QUOTED')?._count ?? 0,
      won: leadsByStatus.find((l) => l.status === 'WON')?._count ?? 0,
      lost: leadsByStatus.find((l) => l.status === 'LOST')?._count ?? 0,
    };

    // Conversion rate
    const totalLeads = leadsByStatus.reduce((sum, l) => sum + l._count, 0);
    const wonLeads = pipelineStats.won;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Revenue stats
    const paidInvoices = await prisma.invoice.findMany({
      where: { orgId, status: 'PAID' },
      select: { total: true },
    });

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Job stats
    const jobsByStatus = await prisma.job.groupBy({
      by: ['status'],
      where: { orgId },
      _count: true,
    });

    const jobStats = {
      scheduled: jobsByStatus.find((j) => j.status === 'SCHEDULED')?._count ?? 0,
      inProgress: jobsByStatus.find((j) => j.status === 'IN_PROGRESS')?._count ?? 0,
      paused: jobsByStatus.find((j) => j.status === 'PAUSED')?._count ?? 0,
      completed: jobsByStatus.find((j) => j.status === 'COMPLETED')?._count ?? 0,
      cancelled: jobsByStatus.find((j) => j.status === 'CANCELLED')?._count ?? 0,
    };

    // Quote stats
    const quotesByStatus = await prisma.quote.groupBy({
      by: ['status'],
      where: { orgId },
      _count: true,
    });

    const quoteStats = {
      draft: quotesByStatus.find((q) => q.status === 'DRAFT')?._count ?? 0,
      sent: quotesByStatus.find((q) => q.status === 'SENT')?._count ?? 0,
      viewed: quotesByStatus.find((q) => q.status === 'VIEWED')?._count ?? 0,
      accepted: quotesByStatus.find((q) => q.status === 'ACCEPTED')?._count ?? 0,
      rejected: quotesByStatus.find((q) => q.status === 'REJECTED')?._count ?? 0,
      expired: quotesByStatus.find((q) => q.status === 'EXPIRED')?._count ?? 0,
    };

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      pipeline: pipelineStats,
      conversionRate: Number(conversionRate.toFixed(2)),
      revenue: {
        total: totalRevenue,
        invoiceCount: paidInvoices.length,
      },
      jobs: jobStats,
      quotes: quoteStats,
      recentActivity,
    };
  });

  // Get revenue over time
  fastify.get('/revenue', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const { period = '30d' } = request.query as { period?: string };

    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        orgId,
        status: 'PAID',
        paidAt: { gte: startDate },
      },
      select: {
        total: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    return { invoices, period };
  });

  // Get vendor performance
  fastify.get('/vendors', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const vendors = await prisma.vendor.findMany({
      where: { orgId, active: true },
      select: {
        id: true,
        name: true,
        reliabilityScore: true,
        totalJobsCompleted: true,
        onTimePercent: true,
        firstPassQCPercent: true,
      },
      orderBy: { reliabilityScore: 'desc' },
    });

    return { vendors };
  });
}
