import { prisma } from '../index';
import { ActivityLogInput, AuthRequest } from '../types';
import { logger } from '../utils/logger';

export class ActivityLogger {
  static async log(
    input: ActivityLogInput,
    request: AuthRequest
  ): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          details: input.details || {},
          ipAddress: input.ipAddress || request.ip,
          userAgent: input.userAgent || request.headers['user-agent'],
          organizationId: request.organizationId || '',
          userId: request.user?.id,
          contactId: input.entityType === 'Contact' ? input.entityId : undefined,
          propertyId: input.entityType === 'PropertyOrSite' ? input.entityId : undefined,
          leadId: input.entityType === 'Lead' ? input.entityId : undefined,
          quoteId: input.entityType === 'Quote' ? input.entityId : undefined,
          jobId: input.entityType === 'Job' ? input.entityId : undefined,
          invoiceId: input.entityType === 'Invoice' ? input.entityId : undefined,
          appointmentId: input.entityType === 'Appointment' ? input.entityId : undefined,
          campaignId: input.entityType === 'Campaign' ? input.entityId : undefined,
          vendorId: input.entityType === 'Vendor' ? input.entityId : undefined
        }
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Don't throw - activity logging should not break the main flow
    }
  }

  static async logUserAction(
    action: string,
    entityType: string,
    entityId: string,
    request: AuthRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      entityType,
      entityId,
      details,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    }, request);
  }

  static async logSystemAction(
    action: string,
    entityType: string,
    entityId: string,
    organizationId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      entityType,
      entityId,
      details
    }, { organizationId } as AuthRequest);
  }
}
