import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getOrgId } from '../middleware/orgScope.js';
import { logActivity } from '../services/activityLog.js';

const createVendorSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  hourlyRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

const updateVendorSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  hourlyRate: z.number().positive().optional(),
  active: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function vendorRoutes(fastify: FastifyInstance) {
  // Get all vendors
  fastify.get('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);

    const vendors = await prisma.vendor.findMany({
      where: { orgId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { vendors };
  });

  // Get single vendor
  fastify.get('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    const vendor = await prisma.vendor.findFirst({
      where: { id, orgId },
      include: {
        user: true,
        jobs: {
          include: { quote: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        timeEntries: {
          orderBy: { clockIn: 'desc' },
          take: 10,
        },
      },
    });

    if (!vendor) {
      return { error: 'Vendor not found' };
    }

    return { vendor };
  });

  // Create vendor
  fastify.post('/', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const orgId = getOrgId(request);
    const body = createVendorSchema.parse(request.body);

    const vendor = await prisma.vendor.create({
      data: {
        orgId,
        ...body,
      },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Vendor',
      entityId: vendor.id,
      action: 'create',
      traceId: request.traceId,
    });

    return { vendor };
  });

  // Update vendor
  fastify.patch('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);
    const body = updateVendorSchema.parse(request.body);

    const vendor = await prisma.vendor.update({
      where: { id, orgId },
      data: body,
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Vendor',
      entityId: id,
      action: 'update',
      changes: body,
      traceId: request.traceId,
    });

    return { vendor };
  });

  // Delete vendor
  fastify.delete('/:id', { onRequest: [fastify.authenticate, fastify.orgScope] }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = getOrgId(request);

    await prisma.vendor.delete({
      where: { id, orgId },
    });

    await logActivity({
      orgId,
      userId: request.user!.id,
      entityType: 'Vendor',
      entityId: id,
      action: 'delete',
      traceId: request.traceId,
    });

    return { success: true };
  });
}
