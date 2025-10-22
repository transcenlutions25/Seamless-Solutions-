import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { Role } from '@prisma/client';

const createVendorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  hourlyRate: z.number().min(0).optional(),
});

const updateVendorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function vendorRoutes(fastify: FastifyInstance) {
  // Get all vendors for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        isActive: z.boolean().optional(),
        specialty: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { isActive, specialty, page, limit, search } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (specialty) {
      where.specialties = {
        has: specialty,
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          jobs: {
            select: {
              id: true,
              status: true,
              scheduledStart: true,
              actualStart: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          clockIns: {
            where: {
              clockOutTime: null,
            },
            include: {
              job: {
                select: { jobNumber: true, title: true },
              },
            },
          },
          _count: {
            select: {
              jobs: true,
            },
          },
        },
        orderBy: [
          { reliabilityScore: 'desc' },
          { firstName: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    reply.send({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single vendor
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        jobs: {
          include: {
            contact: {
              select: { firstName: true, lastName: true },
            },
            property: {
              select: { name: true, address: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        clockIns: {
          include: {
            job: {
              select: { jobNumber: true, title: true },
            },
          },
          orderBy: { clockInTime: 'desc' },
          take: 10,
        },
        activities: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    reply.send({ vendor });
  });

  // Create vendor
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createVendorSchema,
    },
  }, async (request, reply) => {
    const data = createVendorSchema.parse(request.body);

    // Check if vendor with this email already exists in the organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        email: data.email,
        orgId: request.user!.orgId,
      },
    });

    if (existingVendor) {
      return reply.status(409).send({ error: 'Vendor with this email already exists' });
    }

    const vendor = await prisma.$transaction(async (tx) => {
      const created = await tx.vendor.create({
        data: {
          ...data,
          orgId: request.user!.orgId,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'vendor_created',
          entity: 'Vendor',
          entityId: created.id,
          userId: request.user!.id,
          vendorId: created.id,
          details: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            specialties: data.specialties,
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({ vendor });
  });

  // Update vendor
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateVendorSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateVendorSchema.parse(request.body);

    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingVendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingVendor.email) {
      const emailExists = await prisma.vendor.findFirst({
        where: {
          email: data.email,
          orgId: request.user!.orgId,
          id: { not: id },
        },
      });

      if (emailExists) {
        return reply.status(409).send({ error: 'Vendor with this email already exists' });
      }
    }

    const vendor = await prisma.$transaction(async (tx) => {
      const updated = await tx.vendor.update({
        where: { id },
        data,
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'vendor_updated',
          entity: 'Vendor',
          entityId: id,
          userId: request.user!.id,
          vendorId: id,
          details: {
            changes: data,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ vendor });
  });

  // Get vendor performance metrics
  fastify.get('/:id/performance', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    // Get performance metrics
    const [
      totalJobs,
      completedJobs,
      onTimeJobs,
      totalHours,
      recentJobs,
    ] = await Promise.all([
      // Total jobs assigned
      prisma.job.count({
        where: {
          vendorId: id,
          orgId: request.user!.orgId,
        },
      }),
      
      // Completed jobs
      prisma.job.count({
        where: {
          vendorId: id,
          orgId: request.user!.orgId,
          status: 'COMPLETED',
        },
      }),
      
      // On-time jobs (started within 30 minutes of scheduled time)
      prisma.job.count({
        where: {
          vendorId: id,
          orgId: request.user!.orgId,
          status: 'COMPLETED',
          AND: [
            { scheduledStart: { not: null } },
            { actualStart: { not: null } },
          ],
        },
      }),
      
      // Total hours worked (from clock-ins)
      prisma.clockIn.aggregate({
        where: {
          vendorId: id,
          clockOutTime: { not: null },
        },
        _sum: {
          // This would need a computed field or raw query for actual duration
        },
      }),
      
      // Recent jobs for trend analysis
      prisma.job.findMany({
        where: {
          vendorId: id,
          orgId: request.user!.orgId,
        },
        select: {
          id: true,
          status: true,
          scheduledStart: true,
          actualStart: true,
          scheduledEnd: true,
          actualEnd: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Calculate metrics
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    
    // Calculate on-time percentage more accurately
    let onTimePercentage = 0;
    if (recentJobs.length > 0) {
      const onTimeCount = recentJobs.filter(job => {
        if (!job.scheduledStart || !job.actualStart) return false;
        const timeDiff = Math.abs(job.actualStart.getTime() - job.scheduledStart.getTime());
        return timeDiff <= 30 * 60 * 1000; // 30 minutes
      }).length;
      onTimePercentage = (onTimeCount / recentJobs.length) * 100;
    }

    // Calculate average job duration
    const completedJobsWithTimes = recentJobs.filter(job => 
      job.actualStart && job.actualEnd && job.status === 'COMPLETED'
    );
    
    const averageJobDuration = completedJobsWithTimes.length > 0
      ? completedJobsWithTimes.reduce((sum, job) => {
          const duration = job.actualEnd!.getTime() - job.actualStart!.getTime();
          return sum + duration;
        }, 0) / completedJobsWithTimes.length
      : 0;

    reply.send({
      metrics: {
        totalJobs,
        completedJobs,
        completionRate: Math.round(completionRate * 100) / 100,
        onTimePercentage: Math.round(onTimePercentage * 100) / 100,
        averageJobDurationHours: Math.round((averageJobDuration / (1000 * 60 * 60)) * 100) / 100,
        reliabilityScore: vendor.reliabilityScore,
        firstPassQcPercent: vendor.firstPassQcPercent,
      },
      recentJobs: recentJobs.slice(0, 10),
    });
  });

  // Delete vendor (soft delete by setting isActive to false)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        jobs: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    // Check if vendor has active jobs
    if (vendor.jobs.length > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete vendor with active jobs. Please reassign or complete jobs first.' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete by setting isActive to false
      await tx.vendor.update({
        where: { id },
        data: { isActive: false },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'vendor_deleted',
          entity: 'Vendor',
          entityId: id,
          userId: request.user!.id,
          vendorId: id,
          details: {
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
          },
          orgId: request.user!.orgId,
        },
      });
    });

    reply.status(204).send();
  });
}