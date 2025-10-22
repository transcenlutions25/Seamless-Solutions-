import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const createAppointmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  contactId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  jobId: z.string().cuid().optional()
});

const updateAppointmentSchema = createAppointmentSchema.partial();

export async function appointmentRoutes(fastify: FastifyInstance) {
  // Create appointment
  fastify.post('/', {
    schema: {
      body: createAppointmentSchema,
      tags: ['Appointments'],
      summary: 'Create a new appointment'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createAppointmentSchema>;

    try {
      const appointment = await prisma.appointment.create({
        data: {
          ...body,
          organizationId: request.organizationId!,
          userId: request.user?.id
        },
        include: {
          contact: true,
          property: true,
          job: true,
          user: {
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
        'APPOINTMENT_CREATED',
        'Appointment',
        appointment.id,
        request
      );

      return reply.status(201).send(appointment);
    } catch (error) {
      fastify.log.error('Appointment creation error:', error);
      return reply.status(500).send({
        error: 'Creation failed',
        message: 'An error occurred while creating the appointment'
      });
    }
  });

  // Get appointments
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        search: z.string().optional(),
        sortBy: z.string().default('startTime'),
        sortOrder: z.enum(['asc', 'desc']).default('asc')
      }),
      tags: ['Appointments'],
      summary: 'Get appointments with pagination'
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

      if (query.startDate || query.endDate) {
        where.startTime = {};
        if (query.startDate) {
          where.startTime.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.startTime.lte = new Date(query.endDate);
        }
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            contact: true,
            property: true,
            job: true,
            user: {
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
        prisma.appointment.count({ where })
      ]);

      return reply.send({
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Get appointments error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving appointments'
      });
    }
  });

  // Get appointment by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Appointments'],
      summary: 'Get appointment by ID'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        },
        include: {
          contact: true,
          property: true,
          job: true,
          user: {
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

      if (!appointment) {
        return reply.status(404).send({
          error: 'Appointment not found',
          message: 'The specified appointment was not found'
        });
      }

      return reply.send(appointment);
    } catch (error) {
      fastify.log.error('Get appointment error:', error);
      return reply.status(500).send({
        error: 'Retrieval failed',
        message: 'An error occurred while retrieving the appointment'
      });
    }
  });

  // Update appointment
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      body: updateAppointmentSchema,
      tags: ['Appointments'],
      summary: 'Update appointment'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof createAppointmentSchema>>;

    try {
      // Verify appointment exists and belongs to organization
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingAppointment) {
        return reply.status(404).send({
          error: 'Appointment not found',
          message: 'The specified appointment was not found'
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: body,
        include: {
          contact: true,
          property: true,
          job: true,
          user: {
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
        'APPOINTMENT_UPDATED',
        'Appointment',
        appointment.id,
        request,
        { changes: Object.keys(body) }
      );

      return reply.send(appointment);
    } catch (error) {
      fastify.log.error('Appointment update error:', error);
      return reply.status(500).send({
        error: 'Update failed',
        message: 'An error occurred while updating the appointment'
      });
    }
  });

  // Delete appointment
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string().cuid()
      }),
      tags: ['Appointments'],
      summary: 'Delete appointment'
    }
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Verify appointment exists and belongs to organization
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          organizationId: request.organizationId
        }
      });

      if (!existingAppointment) {
        return reply.status(404).send({
          error: 'Appointment not found',
          message: 'The specified appointment was not found'
        });
      }

      await prisma.appointment.delete({
        where: { id }
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'APPOINTMENT_DELETED',
        'Appointment',
        id,
        request
      );

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Appointment deletion error:', error);
      return reply.status(500).send({
        error: 'Deletion failed',
        message: 'An error occurred while deleting the appointment'
      });
    }
  });
}
