import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createAppointmentSchema = z.object({
  type: z.enum(['CONSULTATION', 'ESTIMATE', 'JOB', 'FOLLOWUP', 'INSPECTION']).default('CONSULTATION'),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  attendees: z.any().optional(),
  cancelled: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function appointmentRoutes(fastify: FastifyInstance) {
  // Get appointments
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const { start, end } = request.query as { start?: string; end?: string };

    const where: any = { orgId, cancelled: false };
    
    if (start && end) {
      where.startTime = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return { appointments };
  });

  // Get single appointment
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const appointment = await prisma.appointment.findFirst({
      where: { id, orgId },
    });

    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    return { appointment };
  });

  // Create appointment
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createAppointmentSchema.parse(request.body);

    const appointment = await prisma.appointment.create({
      data: {
        orgId,
        type: body.type,
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location,
        attendees: body.attendees,
        notes: body.notes,
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Appointment',
      entityId: appointment.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { appointment };
  });

  // Update appointment
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateAppointmentSchema.parse(request.body);

    const updateData: any = { ...body };
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);

    const appointment = await prisma.appointment.update({
      where: { id, orgId },
      data: updateData,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Appointment',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { appointment };
  });

  // Delete appointment
  fastify.delete('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    await prisma.appointment.delete({
      where: { id, orgId },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Appointment',
      entityId: id,
      action: 'delete',
      traceId: request.traceId,
    });

    return { success: true };
  });
}
