import { prisma } from '../lib/prisma.js';

interface LogActivityParams {
  orgId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        changes: params.changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        traceId: params.traceId,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log activity:', error);
  }
}
