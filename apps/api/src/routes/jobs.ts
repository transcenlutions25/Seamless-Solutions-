import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { JobStatus, Role, QuoteStatus } from '@prisma/client';
import { generateJobNumber } from '../utils/generators';

const createJobSchema = z.object({
  quoteId: z.string(),
  vendorId: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateJobSchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  vendorId: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
  completionNotes: z.string().optional(),
});

const clockInSchema = z.object({
  jobId: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  clockInId: z.string(),
  notes: z.string().optional(),
});

const uploadQcPhotoSchema = z.object({
  jobId: z.string(),
  photoUrl: z.string().url(),
  description: z.string().optional(),
});

export async function jobRoutes(fastify: FastifyInstance) {
  // Get all jobs for organization
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        status: z.nativeEnum(JobStatus).optional(),
        vendorId: z.string().optional(),
        contactId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, vendorId, contactId, page, limit, search } = request.query as any;
    const offset = (page - 1) * limit;

    const where: any = {
      orgId: request.user!.orgId,
    };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { vendor: { firstName: { contains: search, mode: 'insensitive' } } },
        { vendor: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          contact: true,
          vendor: true,
          property: true,
          quote: {
            include: {
              bid: true,
            },
          },
          invoice: true,
          clockIns: {
            where: {
              clockOutTime: null,
            },
          },
        },
        orderBy: [
          { scheduledStart: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    reply.send({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single job
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        contact: true,
        vendor: true,
        property: true,
        quote: {
          include: {
            bid: true,
          },
        },
        invoice: true,
        clockIns: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            vendor: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { clockInTime: 'desc' },
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
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    reply.send({ job });
  });

  // Create job from accepted quote
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: createJobSchema,
    },
  }, async (request, reply) => {
    const data = createJobSchema.parse(request.body);

    // Verify quote exists and is accepted
    const quote = await prisma.quote.findFirst({
      where: {
        id: data.quoteId,
        orgId: request.user!.orgId,
        status: QuoteStatus.ACCEPTED,
      },
      include: {
        contact: true,
        bid: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!quote) {
      return reply.status(404).send({ error: 'Accepted quote not found' });
    }

    // Check if job already exists for this quote
    const existingJob = await prisma.job.findUnique({
      where: { quoteId: data.quoteId },
    });

    if (existingJob) {
      return reply.status(409).send({ error: 'Job already exists for this quote' });
    }

    // Verify vendor if provided
    if (data.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: {
          id: data.vendorId,
          orgId: request.user!.orgId,
          isActive: true,
        },
      });

      if (!vendor) {
        return reply.status(404).send({ error: 'Vendor not found' });
      }
    }

    const job = await prisma.$transaction(async (tx) => {
      const jobNumber = await generateJobNumber(tx, request.user!.orgId);

      const created = await tx.job.create({
        data: {
          jobNumber,
          quoteId: data.quoteId,
          contactId: quote.contactId,
          vendorId: data.vendorId,
          propertyId: quote.bid.propertyId,
          title: quote.title,
          description: quote.description,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
          totalAmount: quote.totalAmount,
          notes: data.notes,
          orgId: request.user!.orgId,
        },
        include: {
          contact: true,
          vendor: true,
          property: true,
          quote: {
            include: {
              bid: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'job_created',
          entity: 'Job',
          entityId: created.id,
          userId: request.user!.id,
          jobId: created.id,
          contactId: quote.contactId,
          quoteId: data.quoteId,
          details: {
            jobNumber,
            totalAmount: quote.totalAmount,
            scheduledStart: data.scheduledStart,
            vendorId: data.vendorId,
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({ job });
  });

  // Update job
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: updateJobSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateJobSchema.parse(request.body);

    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
    });

    if (!existingJob) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    // Verify vendor if provided
    if (data.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: {
          id: data.vendorId,
          orgId: request.user!.orgId,
          isActive: true,
        },
      });

      if (!vendor) {
        return reply.status(404).send({ error: 'Vendor not found' });
      }
    }

    const updateData: any = {
      ...data,
    };

    // Convert date strings to Date objects
    ['scheduledStart', 'scheduledEnd', 'actualStart', 'actualEnd'].forEach(field => {
      if (data[field as keyof typeof data]) {
        updateData[field] = new Date(data[field as keyof typeof data] as string);
      }
    });

    const job = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data: updateData,
        include: {
          contact: true,
          vendor: true,
          property: true,
          quote: {
            include: {
              bid: true,
            },
          },
        },
      });

      // Update vendor reliability scores if job is completed
      if (data.status === JobStatus.COMPLETED && existingJob.status !== JobStatus.COMPLETED && updated.vendorId) {
        await updateVendorReliability(tx, updated.vendorId);
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'job_updated',
          entity: 'Job',
          entityId: id,
          userId: request.user!.id,
          jobId: id,
          contactId: updated.contactId,
          details: {
            changes: data,
            previousStatus: existingJob.status,
            newStatus: data.status,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ job });
  });

  // Clock in to job
  fastify.post('/clock-in', {
    preHandler: [fastify.authenticate],
    schema: {
      body: clockInSchema,
    },
  }, async (request, reply) => {
    const data = clockInSchema.parse(request.body);

    // Verify job exists and user has access
    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        orgId: request.user!.orgId,
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    // Check if user is already clocked in to this job
    const existingClockIn = await prisma.clockIn.findFirst({
      where: {
        jobId: data.jobId,
        userId: request.user!.id,
        clockOutTime: null,
      },
    });

    if (existingClockIn) {
      return reply.status(409).send({ error: 'Already clocked in to this job' });
    }

    const clockIn = await prisma.$transaction(async (tx) => {
      const created = await tx.clockIn.create({
        data: {
          userId: request.user!.id,
          jobId: data.jobId,
          clockInTime: new Date(),
          location: data.location,
          notes: data.notes,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          job: {
            select: { jobNumber: true, title: true },
          },
        },
      });

      // Update job status to IN_PROGRESS if it's still SCHEDULED
      if (job.status === JobStatus.SCHEDULED) {
        await tx.job.update({
          where: { id: data.jobId },
          data: { 
            status: JobStatus.IN_PROGRESS,
            actualStart: new Date(),
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'clock_in',
          entity: 'Job',
          entityId: data.jobId,
          userId: request.user!.id,
          jobId: data.jobId,
          details: {
            clockInTime: created.clockInTime,
            location: data.location,
          },
          orgId: request.user!.orgId,
        },
      });

      return created;
    });

    reply.status(201).send({ clockIn });
  });

  // Clock out from job
  fastify.post('/clock-out', {
    preHandler: [fastify.authenticate],
    schema: {
      body: clockOutSchema,
    },
  }, async (request, reply) => {
    const data = clockOutSchema.parse(request.body);

    const clockIn = await prisma.clockIn.findFirst({
      where: {
        id: data.clockInId,
        userId: request.user!.id,
        clockOutTime: null,
      },
      include: {
        job: true,
      },
    });

    if (!clockIn) {
      return reply.status(404).send({ error: 'Active clock-in not found' });
    }

    const clockOut = await prisma.$transaction(async (tx) => {
      const updated = await tx.clockIn.update({
        where: { id: data.clockInId },
        data: {
          clockOutTime: new Date(),
          notes: data.notes,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          job: {
            select: { jobNumber: true, title: true },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'clock_out',
          entity: 'Job',
          entityId: clockIn.jobId!,
          userId: request.user!.id,
          jobId: clockIn.jobId!,
          details: {
            clockOutTime: updated.clockOutTime,
            duration: updated.clockOutTime!.getTime() - updated.clockInTime.getTime(),
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ clockOut });
  });

  // Upload QC photo
  fastify.post('/qc-photo', {
    preHandler: [fastify.authenticate],
    schema: {
      body: uploadQcPhotoSchema,
    },
  }, async (request, reply) => {
    const data = uploadQcPhotoSchema.parse(request.body);

    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        orgId: request.user!.orgId,
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id: data.jobId },
        data: {
          qcPhotos: {
            push: data.photoUrl,
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'qc_photo_uploaded',
          entity: 'Job',
          entityId: data.jobId,
          userId: request.user!.id,
          jobId: data.jobId,
          details: {
            photoUrl: data.photoUrl,
            description: data.description,
          },
          orgId: request.user!.orgId,
        },
      });

      return updated;
    });

    reply.send({ 
      message: 'QC photo uploaded successfully',
      job: updatedJob,
    });
  });

  // Delete job
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.findFirst({
      where: {
        id,
        orgId: request.user!.orgId,
      },
      include: {
        invoice: true,
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.invoice) {
      return reply.status(400).send({ 
        error: 'Cannot delete job that has an associated invoice' 
      });
    }

    if (job.status === JobStatus.COMPLETED) {
      return reply.status(400).send({ 
        error: 'Cannot delete completed job' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Log activity before deletion
      await tx.activityLog.create({
        data: {
          action: 'job_deleted',
          entity: 'Job',
          entityId: id,
          userId: request.user!.id,
          jobId: id,
          contactId: job.contactId,
          details: {
            jobNumber: job.jobNumber,
            status: job.status,
            totalAmount: job.totalAmount,
          },
          orgId: request.user!.orgId,
        },
      });

      await tx.job.delete({
        where: { id },
      });
    });

    reply.status(204).send();
  });
}

// Helper function to update vendor reliability scores
async function updateVendorReliability(tx: any, vendorId: string) {
  const jobs = await tx.job.findMany({
    where: {
      vendorId,
      status: JobStatus.COMPLETED,
    },
    select: {
      scheduledStart: true,
      actualStart: true,
      scheduledEnd: true,
      actualEnd: true,
    },
  });

  if (jobs.length === 0) return;

  let onTimeCount = 0;
  let totalJobs = jobs.length;

  jobs.forEach((job: any) => {
    if (job.scheduledStart && job.actualStart) {
      // Consider on-time if started within 30 minutes of scheduled time
      const timeDiff = Math.abs(job.actualStart.getTime() - job.scheduledStart.getTime());
      if (timeDiff <= 30 * 60 * 1000) { // 30 minutes in milliseconds
        onTimeCount++;
      }
    }
  });

  const onTimePercent = (onTimeCount / totalJobs) * 100;
  const reliabilityScore = Math.min(100, onTimePercent + (totalJobs > 10 ? 10 : 0)); // Bonus for experience

  await tx.vendor.update({
    where: { id: vendorId },
    data: {
      onTimePercent,
      reliabilityScore,
      // firstPassQcPercent would be calculated based on QC feedback
    },
  });
}