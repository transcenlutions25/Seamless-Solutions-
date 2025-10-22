import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  orgName: z.string().min(1),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
});

// Lead schemas
export const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  squareFeet: z.number().optional(),
  rooms: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional()
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST', 'ARCHIVED']),
  lostReason: z.string().optional()
});

// Bid schemas
export const createBidSchema = z.object({
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  squareFeet: z.number().int().positive(),
  rooms: z.number().int().positive(),
  bathrooms: z.number().int().positive().default(1),
  daysTarget: z.number().int().positive(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']),
  deepClean: z.boolean().default(false),
  pestControl: z.boolean().default(false),
  flooringRepair: z.boolean().default(false),
  lawnCare: z.boolean().default(false),
  maintenance: z.boolean().default(false),
  deodorize: z.boolean().default(false),
  notes: z.string().optional()
});

// Quote schemas
export const createQuoteSchema = z.object({
  contactId: z.string(),
  propertyId: z.string().optional(),
  bidId: z.string().optional(),
  validDays: z.number().int().default(30),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  discount: z.number().default(0),
  tax: z.number().default(0),
  terms: z.string().optional(),
  notes: z.string().optional()
});

// Job schemas
export const createJobSchema = z.object({
  contactId: z.string(),
  propertyId: z.string().optional(),
  quoteId: z.string().optional(),
  description: z.string(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  instructions: z.string().optional(),
  accessNotes: z.string().optional(),
  assignedToId: z.string().optional()
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  completionNotes: z.string().optional(),
  cancelReason: z.string().optional()
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  contactId: z.string(),
  jobId: z.string().optional(),
  dueDate: z.string().datetime(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  discount: z.number().default(0),
  tax: z.number().default(0),
  terms: z.string().optional(),
  notes: z.string().optional()
});

// Contact schemas
export const createContactSchema = z.object({
  type: z.enum(['LEAD', 'CLIENT', 'VENDOR', 'STAFF']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Property schemas
export const createPropertySchema = z.object({
  contactId: z.string().optional(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  squareFeet: z.number().optional(),
  rooms: z.number().optional(),
  bathrooms: z.number().optional(),
  propertyType: z.string().optional(),
  notes: z.string().optional(),
  accessCode: z.string().optional()
});

// Campaign schemas
export const createCampaignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  channel: z.enum(['EMAIL', 'SMS', 'BOTH']),
  subject: z.string().optional(),
  emailContent: z.string().optional(),
  smsContent: z.string().optional(),
  targetFilters: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional()
});

// Appointment schemas
export const createAppointmentSchema = z.object({
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['MEETING', 'ESTIMATE', 'FOLLOWUP', 'OTHER']).default('MEETING'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  reminderMinutes: z.number().default(15),
  assignedToId: z.string().optional()
});

// Vendor schemas
export const clockInSchema = z.object({
  jobId: z.string(),
  notes: z.string().optional()
});

export const clockOutSchema = z.object({
  clockEntryId: z.string(),
  breakMinutes: z.number().default(0),
  notes: z.string().optional()
});

export const uploadQCPhotoSchema = z.object({
  jobId: z.string(),
  type: z.enum(['BEFORE', 'PROGRESS', 'AFTER', 'ISSUE']),
  caption: z.string().optional()
});

// Payment schemas
export const createPaymentIntentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive()
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string()
});