import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const updateJobSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  vendorId: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  notes: z.string().optional(),
  tasks: z.array(z.any()).optional(),
  checklist: z.array(z.any()).optional(),
});

const addQCPhotoSchema = z.object({
  photoUrl: z.string().url(),
});

export async function jobRoutes(fastify: FastifyInstance) {
  // Get all jobs
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const { status } = request.query as { status?: string };

    const jobs = await prisma.job.findMany({
      where: {
        orgId,
        ...(status && { status: status as any }),
      },
      include: {
        quote: true,
        contact: true,
        property: true,
        vendor: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        timeEntries: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    return { jobs };
  });

  // Get single job
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const job = await prisma.job.findFirst({
      where: { id, orgId },
      include: {
        quote: true,
        contact: true,
        property: true,
        vendor: true,
        assignedTo: true,
        timeEntries: {
          include: { vendor: true },
        },
        invoices: true,
      },
    });

    if (!job) {
      return { error: 'Job not found' };
    }

    return { job };
  });

  // Update job
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateJobSchema.parse(request.body);

    const updateData: any = { ...body };
    if (body.scheduledStart) updateData.scheduledStart = new Date(body.scheduledStart);
    if (body.scheduledEnd) updateData.scheduledEnd = new Date(body.scheduledEnd);

    // Auto-set timestamps
    if (body.status === 'IN_PROGRESS' && !updateData.actualStart) {
      updateData.actualStart = new Date();
    }
    if (body.status === 'COMPLETED' && !updateData.actualEnd) {
      updateData.actualEnd = new Date();
    }

    const job = await prisma.job.update({
      where: { id, orgId },
      data: updateData,
    });

    // Update vendor reliability if job completed
    if (body.status === 'COMPLETED' && job.vendorId) {
      await updateVendorReliability(job.vendorId);
    }

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Job',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { job };
  });

  // Add QC photo
  fastify.post('/:id/photos', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = addQCPhotoSchema.parse(request.body);

    const job = await prisma.job.findFirst({
      where: { id, orgId },
    });

    if (!job) {
      return { error: 'Job not found' };
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        qcPhotos: {
          push: body.photoUrl,
        },
      },
    });

    return { job: updatedJob };
  });

  // Clock in (vendor)
  fastify.post('/:id/clock-in', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const vendor = await prisma.vendor.findFirst({
      where: { userId: request.user!.id, orgId },
    });

    if (!vendor) {
      return { error: 'Vendor profile not found' };
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        jobId: id,
        vendorId: vendor.id,
        clockIn: new Date(),
      },
    });

    return { timeEntry };
  });

  // Clock out (vendor)
  fastify.post('/:id/clock-out', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const vendor = await prisma.vendor.findFirst({
      where: { userId: request.user!.id, orgId },
    });

    if (!vendor) {
      return { error: 'Vendor profile not found' };
    }

    // Find open time entry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        jobId: id,
        vendorId: vendor.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!timeEntry) {
      return { error: 'No open time entry found' };
    }

    const clockOut = new Date();
    const hoursWorked = (clockOut.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60);

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut,
        hoursWorked,
      },
    });

    return { timeEntry: updatedEntry };
  });
}

async function updateVendorReliability(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      jobs: {
        where: { status: 'COMPLETED' },
      },
    },
  });

  if (!vendor) return;

  const completedJobs = vendor.jobs.length;
  const onTimeJobs = vendor.jobs.filter((job) => {
    if (!job.scheduledEnd || !job.actualEnd) return false;
    return job.actualEnd <= job.scheduledEnd;
  }).length;

  const onTimePercent = completedJobs > 0 ? (onTimeJobs / completedJobs) * 100 : 100;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      totalJobsCompleted: completedJobs,
      onTimePercent,
      reliabilityScore: onTimePercent, // Simplified calculation
    },
  });
}
