import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { LeadStatus, JobStatus, InvoiceStatus } from '@prisma/client';

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get dashboard overview
  fastify.get('/dashboard', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: analyticsQuerySchema,
    },
  }, async (request, reply) => {
    const { startDate, endDate, period } = request.query as any;
    
    // Calculate date range
    const now = new Date();
    let dateRange = {
      start: new Date(),
      end: now,
    };

    if (startDate && endDate) {
      dateRange.start = new Date(startDate);
      dateRange.end = new Date(endDate);
    } else {
      switch (period) {
        case '7d':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateRange.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateRange.start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const orgId = request.user!.orgId;

    // Get key metrics
    const [
      totalLeads,
      newLeads,
      totalJobs,
      completedJobs,
      totalRevenue,
      paidInvoices,
      activeVendors,
      totalContacts,
      leadsThisPeriod,
      jobsThisPeriod,
      revenueThisPeriod,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count({
        where: { orgId },
      }),
      
      // New leads in period
      prisma.lead.count({
        where: {
          orgId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      }),
      
      // Total jobs
      prisma.job.count({
        where: { orgId },
      }),
      
      // Completed jobs
      prisma.job.count({
        where: {
          orgId,
          status: JobStatus.COMPLETED,
        },
      }),
      
      // Total revenue
      prisma.invoice.aggregate({
        where: {
          orgId,
          status: InvoiceStatus.PAID,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // Paid invoices count
      prisma.invoice.count({
        where: {
          orgId,
          status: InvoiceStatus.PAID,
        },
      }),
      
      // Active vendors
      prisma.vendor.count({
        where: {
          orgId,
          isActive: true,
        },
      }),
      
      // Total contacts
      prisma.contact.count({
        where: { orgId },
      }),
      
      // Leads this period
      prisma.lead.findMany({
        where: {
          orgId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          estimatedValue: true,
        },
      }),
      
      // Jobs this period
      prisma.job.findMany({
        where: {
          orgId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalAmount: true,
        },
      }),
      
      // Revenue this period
      prisma.invoice.aggregate({
        where: {
          orgId,
          status: InvoiceStatus.PAID,
          paidAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // Calculate conversion rates
    const leadConversionRate = totalLeads > 0 
      ? (leadsThisPeriod.filter(l => l.status === LeadStatus.WON).length / newLeads) * 100 
      : 0;

    const jobCompletionRate = totalJobs > 0 
      ? (completedJobs / totalJobs) * 100 
      : 0;

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime()));
    
    const [previousLeads, previousRevenue] = await Promise.all([
      prisma.lead.count({
        where: {
          orgId,
          createdAt: {
            gte: previousPeriodStart,
            lt: dateRange.start,
          },
        },
      }),
      
      prisma.invoice.aggregate({
        where: {
          orgId,
          status: InvoiceStatus.PAID,
          paidAt: {
            gte: previousPeriodStart,
            lt: dateRange.start,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const leadsTrend = previousLeads > 0 
      ? ((newLeads - previousLeads) / previousLeads) * 100 
      : 0;

    const revenueTrend = previousRevenue._sum.totalAmount 
      ? ((revenueThisPeriod._sum.totalAmount || 0) - previousRevenue._sum.totalAmount) / previousRevenue._sum.totalAmount * 100
      : 0;

    reply.send({
      period: {
        start: dateRange.start,
        end: dateRange.end,
        label: period,
      },
      metrics: {
        leads: {
          total: totalLeads,
          new: newLeads,
          conversionRate: Math.round(leadConversionRate * 100) / 100,
          trend: Math.round(leadsTrend * 100) / 100,
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completionRate: Math.round(jobCompletionRate * 100) / 100,
          inPeriod: jobsThisPeriod.length,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          inPeriod: revenueThisPeriod._sum.totalAmount || 0,
          invoicesPaid: paidInvoices,
          trend: Math.round(revenueTrend * 100) / 100,
        },
        resources: {
          activeVendors,
          totalContacts,
        },
      },
    });
  });

  // Get lead pipeline analytics
  fastify.get('/pipeline', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: analyticsQuerySchema,
    },
  }, async (request, reply) => {
    const { startDate, endDate, period } = request.query as any;
    
    const now = new Date();
    let dateRange = {
      start: new Date(),
      end: now,
    };

    if (startDate && endDate) {
      dateRange.start = new Date(startDate);
      dateRange.end = new Date(endDate);
    } else {
      switch (period) {
        case '7d':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateRange.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateRange.start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const orgId = request.user!.orgId;

    // Get leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        orgId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        estimatedValue: true,
      },
    });

    // Get lead sources
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: {
        orgId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        estimatedValue: true,
      },
    });

    // Get conversion funnel
    const totalLeads = await prisma.lead.count({
      where: {
        orgId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const qualifiedLeads = await prisma.lead.count({
      where: {
        orgId,
        status: { in: [LeadStatus.QUALIFIED, LeadStatus.QUOTED, LeadStatus.WON] },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const quotedLeads = await prisma.lead.count({
      where: {
        orgId,
        status: { in: [LeadStatus.QUOTED, LeadStatus.WON] },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const wonLeads = await prisma.lead.count({
      where: {
        orgId,
        status: LeadStatus.WON,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    reply.send({
      period: {
        start: dateRange.start,
        end: dateRange.end,
        label: period,
      },
      pipeline: {
        byStatus: leadsByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          value: item._sum.estimatedValue || 0,
        })),
        bySource: leadsBySource.map(item => ({
          source: item.source || 'Unknown',
          count: item._count.id,
          value: item._sum.estimatedValue || 0,
        })),
        funnel: {
          leads: totalLeads,
          qualified: qualifiedLeads,
          quoted: quotedLeads,
          won: wonLeads,
          qualificationRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
          quoteRate: qualifiedLeads > 0 ? (quotedLeads / qualifiedLeads) * 100 : 0,
          winRate: quotedLeads > 0 ? (wonLeads / quotedLeads) * 100 : 0,
        },
      },
    });
  });

  // Get revenue analytics
  fastify.get('/revenue', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: analyticsQuerySchema,
    },
  }, async (request, reply) => {
    const { startDate, endDate, period } = request.query as any;
    
    const now = new Date();
    let dateRange = {
      start: new Date(),
      end: now,
    };

    if (startDate && endDate) {
      dateRange.start = new Date(startDate);
      dateRange.end = new Date(endDate);
    } else {
      switch (period) {
        case '7d':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateRange.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateRange.start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const orgId = request.user!.orgId;

    // Get revenue by month
    const revenueByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "paidAt") as month,
        SUM("totalAmount") as revenue,
        COUNT(*) as invoices
      FROM "invoices"
      WHERE "orgId" = ${orgId}
        AND "status" = 'PAID'
        AND "paidAt" >= ${dateRange.start}
        AND "paidAt" <= ${dateRange.end}
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY month
    `;

    // Get invoice status breakdown
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        orgId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get average invoice value
    const averageInvoiceValue = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _avg: {
        totalAmount: true,
      },
    });

    // Get outstanding invoices
    const outstandingInvoices = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    reply.send({
      period: {
        start: dateRange.start,
        end: dateRange.end,
        label: period,
      },
      revenue: {
        byMonth: revenueByMonth,
        byStatus: invoicesByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          amount: item._sum.totalAmount || 0,
        })),
        metrics: {
          averageInvoiceValue: averageInvoiceValue._avg.totalAmount || 0,
          outstandingAmount: outstandingInvoices._sum.totalAmount || 0,
          outstandingCount: outstandingInvoices._count.id,
        },
      },
    });
  });

  // Get performance analytics
  fastify.get('/performance', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: analyticsQuerySchema,
    },
  }, async (request, reply) => {
    const { startDate, endDate, period } = request.query as any;
    
    const now = new Date();
    let dateRange = {
      start: new Date(),
      end: now,
    };

    if (startDate && endDate) {
      dateRange.start = new Date(startDate);
      dateRange.end = new Date(endDate);
    } else {
      switch (period) {
        case '7d':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateRange.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateRange.start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const orgId = request.user!.orgId;

    // Get job performance metrics
    const [jobsByStatus, vendorPerformance, averageJobDuration] = await Promise.all([
      // Jobs by status
      prisma.job.groupBy({
        by: ['status'],
        where: {
          orgId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // Vendor performance
      prisma.vendor.findMany({
        where: {
          orgId,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          reliabilityScore: true,
          onTimePercent: true,
          firstPassQcPercent: true,
          _count: {
            select: {
              jobs: {
                where: {
                  createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          reliabilityScore: 'desc',
        },
        take: 10,
      }),
      
      // Average job duration
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("actualEnd" - "actualStart")) / 3600) as avg_hours
        FROM "jobs"
        WHERE "orgId" = ${orgId}
          AND "status" = 'COMPLETED'
          AND "actualStart" IS NOT NULL
          AND "actualEnd" IS NOT NULL
          AND "createdAt" >= ${dateRange.start}
          AND "createdAt" <= ${dateRange.end}
      `,
    ]);

    reply.send({
      period: {
        start: dateRange.start,
        end: dateRange.end,
        label: period,
      },
      performance: {
        jobs: {
          byStatus: jobsByStatus.map(item => ({
            status: item.status,
            count: item._count.id,
            value: item._sum.totalAmount || 0,
          })),
          averageDurationHours: averageJobDuration[0]?.avg_hours || 0,
        },
        vendors: vendorPerformance.map(vendor => ({
          id: vendor.id,
          name: `${vendor.firstName} ${vendor.lastName}`,
          reliabilityScore: vendor.reliabilityScore,
          onTimePercent: vendor.onTimePercent,
          firstPassQcPercent: vendor.firstPassQcPercent,
          jobsInPeriod: vendor._count.jobs,
        })),
      },
    });
  });

  // Update organization price multiplier based on performance
  fastify.post('/update-pricing', {
    preHandler: [fastify.authenticate, fastify.requireRole(['OWNER'])],
  }, async (request, reply) => {
    const orgId = request.user!.orgId;

    // Get recent performance metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [winRate, averageJobValue, completionRate] = await Promise.all([
      // Win rate
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN status = 'WON' THEN 1 END)::float / COUNT(*)::float * 100 as win_rate
        FROM "leads"
        WHERE "orgId" = ${orgId}
          AND "createdAt" >= ${thirtyDaysAgo}
      `,
      
      // Average job value
      prisma.job.aggregate({
        where: {
          orgId,
          status: JobStatus.COMPLETED,
          createdAt: { gte: thirtyDaysAgo },
        },
        _avg: {
          totalAmount: true,
        },
      }),
      
      // Completion rate
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::float / COUNT(*)::float * 100 as completion_rate
        FROM "jobs"
        WHERE "orgId" = ${orgId}
          AND "createdAt" >= ${thirtyDaysAgo}
      `,
    ]);

    // Calculate new price multiplier
    let newMultiplier = 1.0;
    const currentWinRate = winRate[0]?.win_rate || 0;
    const currentCompletionRate = completionRate[0]?.completion_rate || 0;

    // Adjust based on performance
    if (currentWinRate > 80 && currentCompletionRate > 95) {
      newMultiplier = 1.1; // Increase prices by 10%
    } else if (currentWinRate > 60 && currentCompletionRate > 90) {
      newMultiplier = 1.05; // Increase prices by 5%
    } else if (currentWinRate < 30 || currentCompletionRate < 80) {
      newMultiplier = 0.95; // Decrease prices by 5%
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: { priceMultiplier: newMultiplier },
    });

    reply.send({
      message: 'Price multiplier updated based on performance',
      metrics: {
        winRate: currentWinRate,
        completionRate: currentCompletionRate,
        averageJobValue: averageJobValue._avg.totalAmount || 0,
      },
      priceMultiplier: {
        previous: 1.0, // Would need to track this
        new: newMultiplier,
        change: ((newMultiplier - 1.0) * 100).toFixed(1) + '%',
      },
    });
  });
}