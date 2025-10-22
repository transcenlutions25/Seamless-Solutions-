export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  role: 'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT'
  isActive: boolean
  createdAt: string
  updatedAt: string
  organization?: Organization
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  logo?: string
  settings?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  type: 'LEAD' | 'CLIENT' | 'VENDOR' | 'INTERNAL'
  notes?: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  leads?: Lead[]
  properties?: PropertyOrSite[]
  jobs?: Job[]
  invoices?: Invoice[]
  appointments?: Appointment[]
}

export interface PropertyOrSite {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  propertyType?: string
  squareFootage?: number
  bedrooms?: number
  bathrooms?: number
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  contactId?: string
  contact?: Contact
  leads?: Lead[]
  jobs?: Job[]
}

export interface Lead {
  id: string
  title: string
  description?: string
  status: 'NEW' | 'QUALIFIED' | 'QUOTED' | 'WON' | 'LOST'
  source?: string
  value?: number
  priority?: 'low' | 'medium' | 'high'
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  organizationId: string
  contactId?: string
  contact?: Contact
  propertyId?: string
  property?: PropertyOrSite
  createdById?: string
  createdBy?: User
  assignedToId?: string
  assignedTo?: User
  bids?: Bid[]
  quotes?: Quote[]
}

export interface Bid {
  id: string
  squareFootage: number
  rooms: number
  daysTarget: number
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY'
  scope: Record<string, boolean>
  basePrice: number
  rushMultiplier: number
  riskFactor: number
  overhead: number
  margin: number
  totalPrice: number
  notes?: string
  createdAt: string
  updatedAt: string
  leadId: string
  lead?: Lead
  quotes?: Quote[]
}

export interface Quote {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  subtotal: number
  tax: number
  discount: number
  total: number
  validUntil?: string
  notes?: string
  createdAt: string
  updatedAt: string
  organizationId: string
  leadId?: string
  lead?: Lead
  bidId?: string
  bid?: Bid
  createdById?: string
  createdBy?: User
  jobs?: Job[]
  invoices?: Invoice[]
}

export interface Job {
  id: string
  title: string
  description?: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
  startDate?: string
  endDate?: string
  estimatedHours?: number
  actualHours?: number
  notes?: string
  qcPhotos: string[]
  createdAt: string
  updatedAt: string
  organizationId: string
  contactId?: string
  contact?: Contact
  propertyId?: string
  property?: PropertyOrSite
  quoteId?: string
  quote?: Quote
  createdById?: string
  createdBy?: User
  assignedToId?: string
  assignedTo?: User
  vendorId?: string
  vendor?: Vendor
  invoices?: Invoice[]
  appointments?: Appointment[]
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  subtotal: number
  tax: number
  discount: number
  total: number
  dueDate?: string
  paidDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  organizationId: string
  contactId?: string
  contact?: Contact
  quoteId?: string
  quote?: Quote
  jobId?: string
  job?: Job
  createdById?: string
  createdBy?: User
}

export interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  notes?: string
  isRecurring: boolean
  recurrencePattern?: string
  createdAt: string
  updatedAt: string
  organizationId: string
  contactId?: string
  contact?: Contact
  propertyId?: string
  property?: PropertyOrSite
  jobId?: string
  job?: Job
  userId?: string
  user?: User
}

export interface Campaign {
  id: string
  name: string
  description?: string
  type: 'EMAIL' | 'SMS' | 'PHONE' | 'WEBSITE' | 'REFERRAL' | 'SOCIAL'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  subject?: string
  content?: string
  targetAudience?: Record<string, any>
  scheduledAt?: string
  sentAt?: string
  metrics?: Record<string, any>
  createdAt: string
  updatedAt: string
  organizationId: string
  createdById?: string
  createdBy?: User
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  specialties: string[]
  hourlyRate?: number
  reliabilityScore?: number
  onTimePercent?: number
  firstPassPercent?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  jobs?: Job[]
}

export interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  organizationId: string
  userId?: string
  user?: User
  contactId?: string
  contact?: Contact
  propertyId?: string
  property?: PropertyOrSite
  leadId?: string
  lead?: Lead
  quoteId?: string
  quote?: Quote
  jobId?: string
  job?: Job
  invoiceId?: string
  invoice?: Invoice
  appointmentId?: string
  appointment?: Appointment
  campaignId?: string
  campaign?: Campaign
  vendorId?: string
  vendor?: Vendor
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BidCalculationInput {
  squareFootage: number
  rooms: number
  daysTarget: number
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY'
  scope: {
    deepClean: boolean
    pestControl: boolean
    flooring: boolean
    lawnCare: boolean
    maintenance: boolean
    deodorize: boolean
    [key: string]: boolean
  }
  notes?: string
}

export interface BidCalculationResult {
  basePrice: number
  rushMultiplier: number
  riskFactor: number
  overhead: number
  margin: number
  totalPrice: number
  breakdown: {
    [key: string]: number
  }
}

export interface OrganizationStats {
  leads: {
    total: number
    active: number
  }
  contacts: {
    total: number
  }
  jobs: {
    total: number
    completed: number
  }
  invoices: {
    total: number
    paid: number
  }
}

// NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role: string
      organization?: Organization
    }
    accessToken?: string
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    role: string
    organization?: Organization
    token?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organization?: Organization
    accessToken?: string
  }
}
