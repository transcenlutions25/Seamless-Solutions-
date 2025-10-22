export const ROLES = {
  OWNER: 'OWNER',
  STAFF: 'STAFF',
  VENDOR: 'VENDOR',
  CLIENT: 'CLIENT'
} as const;

export const LEAD_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  QUOTED: 'QUOTED',
  WON: 'WON',
  LOST: 'LOST',
  ARCHIVED: 'ARCHIVED'
} as const;

export const JOB_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const;

export const TIERS = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  LUXURY: 'LUXURY'
} as const;

export const COLORS = {
  primary: '#00A8A8', // Teal
  secondary: '#6B7280', // Gray
  dark: '#0B0E0F', // Black
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
} as const;