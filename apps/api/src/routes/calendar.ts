import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function calendarRoutes(app: FastifyInstance) {
  app.post('/jobs/:id/appointments', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const orgId = request.orgId!;
    const job = await app.prisma.job.findFirst({ where: { id: params.id, orgId } });
    if (!job) return reply.code(404).send({ error: 'Job not found' });

    const body = z
      .object({
        title: z.string().optional(),
        notes: z.string().optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .parse(request.body);

    const appt = await app.prisma.appointment.create({
      data: {
        orgId,
        jobId: job.id,
        title: body.title,
        notes: body.notes,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      },
    });

    return appt;
  });

  app.get('/appointments', async (request) => {
    const orgId = request.orgId!;
    const { from, to } = z
      .object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() })
      .parse(request.query);

    return app.prisma.appointment.findMany({
      where: {
        orgId,
        ...(from || to
          ? {
              startsAt: { gte: from ? new Date(from) : undefined },
              endsAt: { lte: to ? new Date(to) : undefined },
            }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
  });
}
