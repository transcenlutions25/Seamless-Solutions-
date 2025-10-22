import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function vendorRoutes(app: FastifyInstance) {
  app.post('/vendors', async (request) => {
    const orgId = request.orgId!;
    const body = z.object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional() }).parse(request.body);
    return app.prisma.vendor.create({ data: { orgId, name: body.name, email: body.email, phone: body.phone } });
  });

  app.get('/vendors', async (request) => {
    const orgId = request.orgId!;
    return app.prisma.vendor.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  });

  app.post('/vendors/:id/clock', async (request) => {
    const orgId = request.orgId!;
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ action: z.enum(['in', 'out']), at: z.string().datetime().optional() }).parse(request.body);

    const vendor = await app.prisma.vendor.findFirst({ where: { id: params.id, orgId } });
    if (!vendor) return { ok: false };

    await app.prisma.activityLog.create({
      data: {
        orgId,
        actorUserId: request.user?.userId,
        action: body.action === 'in' ? 'VENDOR_CLOCK_IN' : 'VENDOR_CLOCK_OUT',
        targetType: 'Vendor',
        targetId: vendor.id,
        metadata: { at: body.at ?? new Date().toISOString() },
      },
    });

    // Naive reliability bump example: keep within 0-100
    const newOnTime = Math.min(100, vendor.onTimePercent + (body.action === 'in' ? 1 : 0));
    const updated = await app.prisma.vendor.update({ where: { id: vendor.id }, data: { onTimePercent: newOnTime } });
    return { ok: true, vendor: updated };
  });

  app.post('/vendors/:id/qc-photos', async (request) => {
    const orgId = request.orgId!;
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ storageKey: z.string(), contentType: z.string().optional() }).parse(request.body);

    const vendor = await app.prisma.vendor.findFirst({ where: { id: params.id, orgId } });
    if (!vendor) return { ok: false };

    const file = await app.prisma.fileAsset.create({
      data: { orgId, vendorId: vendor.id, storageKey: body.storageKey, contentType: body.contentType },
    });

    await app.prisma.activityLog.create({
      data: {
        orgId,
        actorUserId: request.user?.userId,
        action: 'QC_PHOTO_UPLOADED',
        targetType: 'Vendor',
        targetId: vendor.id,
        metadata: { fileId: file.id },
      },
    });

    const updatedScore = Math.min(100, vendor.firstPassQcPercent + 1);
    await app.prisma.vendor.update({ where: { id: vendor.id }, data: { firstPassQcPercent: updatedScore } });

    return { ok: true, file };
  });
}
