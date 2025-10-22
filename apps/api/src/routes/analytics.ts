import { FastifyInstance } from 'fastify';

export default async function analyticsRoutes(app: FastifyInstance) {
  app.get('/analytics/kpis', async (request) => {
    const orgId = request.orgId!;

    const [leadCounts, revenueAgg, jobCounts] = await Promise.all([
      app.prisma.lead.groupBy({ by: ['status'], where: { orgId }, _count: { _all: true } }),
      app.prisma.invoice.aggregate({ where: { orgId, status: 'PAID' }, _sum: { amount: true } }),
      app.prisma.job.groupBy({ by: ['status'], where: { orgId }, _count: { _all: true } }),
    ]);

    const pipeline = Object.fromEntries(leadCounts.map((x) => [x.status, x._count._all]));
    const revenue = revenueAgg._sum.amount ?? 0;
    const jobs = Object.fromEntries(jobCounts.map((x) => [x.status, x._count._all]));

    return { pipeline, revenue, jobs };
  });
}
