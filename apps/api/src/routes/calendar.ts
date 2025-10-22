import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { Role } from '@prisma/client';

const createAppointmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  reminders: z.object({
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    minutesBefore: z.number().min(0).default(15),
  }).optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

export async function calendarRoutes(fastify: FastifyInstance) {
  // Get calendar events (appointments + jobs)
  fastify.get('/events', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        type: z.enum(['all', 'appointments', 'jobs']).default('all'),
      }),
    },
  }, async (request, reply) => {
    const { start, end, type } = request.query as any;
    const startDate = new Date(start);
    const endDate = new Date(end);

    const events = [];

    // Get appointments if requested
    if (type === 'all' || type === 'appointments') {
      const appointments = await prisma.appointment.findMany({
        where: {
          orgId: request.user!.orgId,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { startTime: 'asc' },
      });

      events.push(...appointments.map(apt => ({
        id: apt.id,
        type: 'appointment',
        title: apt.title,
        description: apt.description,
        start: apt.startTime,
        end: apt.endTime,
        location: apt.location,
        attendees: apt.attendees,
        color: '#00A8A8',
      })));
    }

    // Get jobs if requested
    if (type === 'all' || type === 'jobs') {
      const jobs = await prisma.job.findMany({
        where: {
          orgId: request.user!.orgId,
          OR: [
            {
              scheduledStart: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              scheduledEnd: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        include: {
          contact: {
            select: { firstName: true, lastName: true },
          },
          vendor: {
            select: { firstName: true, lastName: true },
          },
          property: {
            select: { name: true, address: true },
          },
        },
        orderBy: { scheduledStart: 'asc' },
      });

      events.push(...jobs.map(job => ({
        id: job.id,
        type: 'job',
        title: `${job.title} - ${job.contact.firstName} ${job.contact.lastName || ''}`,
        description: job.description,
        start: job.scheduledStart,
        end: job.scheduledEnd,
        location: job.property?.address,
        vendor: job.vendor ? `${job.vendor.firstName} ${job.vendor.lastName}` : null,
        status: job.status,
        color: getJobStatusColor(job.status),
        jobNumber: job.jobNumber,
      })));
    }

    // Sort all events by start time
    events.sort((a, b) => {
      const aTime = a.start ? new Date(a.start).getTime() : 0;
      const bTime = b.start ? new Date(b.start).getTime() : 0;
      return aTime - bTime;
    });

    reply.send({ events });
  });

  // Get appointments
  fastify.get('/appointments', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        upcoming: z.boolean().default(false),
      }),
    },
  }, async (request, reply) => {
    const { page, limit, upcoming } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (upcoming) {
      where.startTime = {
        gte: new Date(),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { startTime: upcoming ? 'asc' : 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    reply.send({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single appointment
  fastify.get('/appointments/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    reply.send({ appointment });
  });

  // Create appointment
  fastify.post('/appointments', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createAppointmentSchema,
    },
  }, async (request, reply) => {
    const data = createAppointmentSchema.parse(request.body);

    // Validate time range
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      return reply.status(400).send({ error: 'End time must be after start time' });
    }

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        orgId: request.user!.orgId,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return reply.status(409).send({ 
        error: 'Time slot conflicts with existing appointment',
        conflictingAppointment: {
          id: conflictingAppointment.id,
          title: conflictingAppointment.title,
          startTime: conflictingAppointment.startTime,
          endTime: conflictingAppointment.endTime,
        },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        location: data.location,
        attendees: data.attendees,
        reminders: data.reminders,
        orgId: request.user!.orgId,
      },
    });

    reply.status(201).send({ appointment });
  });

  // Update appointment
  fastify.put('/appointments/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateAppointmentSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateAppointmentSchema.parse(request.body);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingAppointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    const updateData: any = { ...data };

    // Convert date strings to Date objects
    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    // Validate time range if both times are provided
    const startTime = updateData.startTime || existingAppointment.startTime;
    const endTime = updateData.endTime || existingAppointment.endTime;

    if (endTime <= startTime) {
      return reply.status(400).send({ error: 'End time must be after start time' });
    }

    // Check for conflicts if time is being changed
    if (data.startTime || data.endTime) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          orgId: request.user!.orgId,
          id: { not: id }, // Exclude current appointment
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        return reply.status(409).send({ 
          error: 'Time slot conflicts with existing appointment',
          conflictingAppointment: {
            id: conflictingAppointment.id,
            title: conflictingAppointment.title,
            startTime: conflictingAppointment.startTime,
            endTime: conflictingAppointment.endTime,
          },
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    reply.send({ appointment });
  });

  // Delete appointment
  fastify.delete('/appointments/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    reply.status(204).send();
  });

  // Get availability for scheduling
  fastify.get('/availability', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        duration: z.number().min(15).default(60), // Duration in minutes
      }),
    },
  }, async (request, reply) => {
    const { date, duration } = request.query as any;
    const targetDate = new Date(date);
    
    // Set business hours (9 AM to 6 PM)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(18, 0, 0, 0);

    // Get all appointments and jobs for the day
    const [appointments, jobs] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          orgId: request.user!.orgId,
          startTime: {
            gte: startOfDay,
            lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
      prisma.job.findMany({
        where: {
          orgId: request.user!.orgId,
          scheduledStart: {
            gte: startOfDay,
            lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        select: {
          scheduledStart: true,
          scheduledEnd: true,
        },
      }),
    ]);

    // Combine all busy periods
    const busyPeriods = [
      ...appointments.map(apt => ({
        start: apt.startTime,
        end: apt.endTime,
      })),
      ...jobs.map(job => ({
        start: job.scheduledStart,
        end: job.scheduledEnd,
      })),
    ].filter(period => period.start && period.end)
     .sort((a, b) => a.start!.getTime() - b.start!.getTime());

    // Generate available time slots
    const availableSlots = [];
    const slotDuration = duration * 60 * 1000; // Convert to milliseconds
    
    let currentTime = startOfDay.getTime();
    
    for (const busyPeriod of busyPeriods) {
      const busyStart = busyPeriod.start!.getTime();
      const busyEnd = busyPeriod.end!.getTime();
      
      // Add slots before this busy period
      while (currentTime + slotDuration <= busyStart) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(currentTime + slotDuration),
        });
        currentTime += 30 * 60 * 1000; // 30-minute intervals
      }
      
      // Move current time to after this busy period
      currentTime = Math.max(currentTime, busyEnd);
    }
    
    // Add remaining slots until end of day
    while (currentTime + slotDuration <= endOfDay.getTime()) {
      availableSlots.push({
        start: new Date(currentTime),
        end: new Date(currentTime + slotDuration),
      });
      currentTime += 30 * 60 * 1000; // 30-minute intervals
    }

    reply.send({
      date,
      duration,
      businessHours: {
        start: startOfDay,
        end: endOfDay,
      },
      availableSlots,
      busyPeriods,
    });
  });
}

function getJobStatusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return '#3B82F6'; // Blue
    case 'IN_PROGRESS':
      return '#F59E0B'; // Amber
    case 'COMPLETED':
      return '#10B981'; // Green
    case 'CANCELLED':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}