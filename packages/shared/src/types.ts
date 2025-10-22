import { z } from 'zod';
import * as schemas from './schemas';

// Infer types from schemas
export type LoginInput = z.infer<typeof schemas.loginSchema>;
export type SignupInput = z.infer<typeof schemas.signupSchema>;
export type CreateLeadInput = z.infer<typeof schemas.createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof schemas.updateLeadStatusSchema>;
export type CreateBidInput = z.infer<typeof schemas.createBidSchema>;
export type CreateQuoteInput = z.infer<typeof schemas.createQuoteSchema>;
export type CreateJobInput = z.infer<typeof schemas.createJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof schemas.updateJobStatusSchema>;
export type CreateInvoiceInput = z.infer<typeof schemas.createInvoiceSchema>;
export type CreateContactInput = z.infer<typeof schemas.createContactSchema>;
export type CreatePropertyInput = z.infer<typeof schemas.createPropertySchema>;
export type CreateCampaignInput = z.infer<typeof schemas.createCampaignSchema>;
export type CreateAppointmentInput = z.infer<typeof schemas.createAppointmentSchema>;
export type ClockInInput = z.infer<typeof schemas.clockInSchema>;
export type ClockOutInput = z.infer<typeof schemas.clockOutSchema>;
export type UploadQCPhotoInput = z.infer<typeof schemas.uploadQCPhotoSchema>;
export type CreatePaymentIntentInput = z.infer<typeof schemas.createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof schemas.confirmPaymentSchema>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// JWT Token payload
export interface JWTPayload {
  userId: string;
  orgId: string;
  role: string;
  email: string;
}

// Bid calculation result
export interface BidCalculationResult {
  basePrice: number;
  rushMultiplier: number;
  riskFactor: number;
  overhead: number;
  margin: number;
  totalPrice: number;
  breakdown: {
    labor: number;
    materials: number;
    equipment: number;
    services: Record<string, number>;
  };
}

// Analytics types
export interface DashboardMetrics {
  pipeline: {
    new: number;
    qualified: number;
    quoted: number;
    won: number;
    lost: number;
    total: number;
    conversionRate: number;
  };
  revenue: {
    current: number;
    previous: number;
    growth: number;
    pending: number;
    overdue: number;
  };
  jobs: {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  performance: {
    avgJobTime: number;
    avgResponseTime: number;
    customerSatisfaction: number;
    vendorReliability: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Activity types
export interface Activity {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userName?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}