import { User, Organization, Role } from '@prisma/client';

export interface AuthenticatedUser extends User {
  organization?: Organization;
}

export interface AuthRequest {
  user?: AuthenticatedUser;
  organizationId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BidCalculationInput {
  squareFootage: number;
  rooms: number;
  daysTarget: number;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY';
  scope: {
    deepClean: boolean;
    pestControl: boolean;
    flooring: boolean;
    lawnCare: boolean;
    maintenance: boolean;
    deodorize: boolean;
    [key: string]: boolean;
  };
  notes?: string;
}

export interface BidCalculationResult {
  basePrice: number;
  rushMultiplier: number;
  riskFactor: number;
  overhead: number;
  margin: number;
  totalPrice: number;
  breakdown: {
    [key: string]: number;
  };
}

export interface ActivityLogInput {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SMSTemplate {
  message: string;
}

export interface CampaignTarget {
  contactTypes?: string[];
  tags?: string[];
  leadStatuses?: string[];
  customFilters?: Record<string, any>;
}
