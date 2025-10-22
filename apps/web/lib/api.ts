const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(data: {
    email: string
    password: string
    firstName: string
    lastName?: string
    phone?: string
    organizationName: string
    organizationSlug: string
    organizationDescription?: string
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }

  // Organization endpoints
  async getOrganization() {
    return this.request('/api/organizations')
  }

  async updateOrganization(data: any) {
    return this.request('/api/organizations', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getOrganizationStats() {
    return this.request('/api/organizations/stats')
  }

  // Lead endpoints
  async getLeads(params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/leads?${searchParams.toString()}`)
  }

  async getLead(id: string) {
    return this.request(`/api/leads/${id}`)
  }

  async createLead(data: any) {
    return this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLead(id: string, data: any) {
    return this.request(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLead(id: string) {
    return this.request(`/api/leads/${id}`, {
      method: 'DELETE',
    })
  }

  // Contact endpoints
  async getContacts(params?: {
    page?: number
    limit?: number
    type?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/contacts?${searchParams.toString()}`)
  }

  async getContact(id: string) {
    return this.request(`/api/contacts/${id}`)
  }

  async createContact(data: any) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateContact(id: string, data: any) {
    return this.request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteContact(id: string) {
    return this.request(`/api/contacts/${id}`, {
      method: 'DELETE',
    })
  }

  // Bid endpoints
  async calculateBid(data: any) {
    return this.request('/api/bids/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBids(params?: {
    page?: number
    limit?: number
    leadId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/bids?${searchParams.toString()}`)
  }

  async getBid(id: string) {
    return this.request(`/api/bids/${id}`)
  }

  async createBid(data: any) {
    return this.request('/api/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBid(id: string, data: any) {
    return this.request(`/api/bids/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBid(id: string) {
    return this.request(`/api/bids/${id}`, {
      method: 'DELETE',
    })
  }

  // Quote endpoints
  async getQuotes(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/quotes?${searchParams.toString()}`)
  }

  async getQuote(id: string) {
    return this.request(`/api/quotes/${id}`)
  }

  async createQuote(data: any) {
    return this.request('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateQuote(id: string, data: any) {
    return this.request(`/api/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteQuote(id: string) {
    return this.request(`/api/quotes/${id}`, {
      method: 'DELETE',
    })
  }

  // Job endpoints
  async getJobs(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/jobs?${searchParams.toString()}`)
  }

  async getJob(id: string) {
    return this.request(`/api/jobs/${id}`)
  }

  async createJob(data: any) {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateJob(id: string, data: any) {
    return this.request(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteJob(id: string) {
    return this.request(`/api/jobs/${id}`, {
      method: 'DELETE',
    })
  }

  // Invoice endpoints
  async getInvoices(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/invoices?${searchParams.toString()}`)
  }

  async getInvoice(id: string) {
    return this.request(`/api/invoices/${id}`)
  }

  async createInvoice(data: any) {
    return this.request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInvoice(id: string, data: any) {
    return this.request(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteInvoice(id: string) {
    return this.request(`/api/invoices/${id}`, {
      method: 'DELETE',
    })
  }

  // Appointment endpoints
  async getAppointments(params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/appointments?${searchParams.toString()}`)
  }

  async getAppointment(id: string) {
    return this.request(`/api/appointments/${id}`)
  }

  async createAppointment(data: any) {
    return this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAppointment(id: string, data: any) {
    return this.request(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAppointment(id: string) {
    return this.request(`/api/appointments/${id}`, {
      method: 'DELETE',
    })
  }

  // Campaign endpoints
  async getCampaigns(params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/campaigns?${searchParams.toString()}`)
  }

  async getCampaign(id: string) {
    return this.request(`/api/campaigns/${id}`)
  }

  async createCampaign(data: any) {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCampaign(id: string, data: any) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCampaign(id: string) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'DELETE',
    })
  }

  // Vendor endpoints
  async getVendors(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/vendors?${searchParams.toString()}`)
  }

  async getVendor(id: string) {
    return this.request(`/api/vendors/${id}`)
  }

  async createVendor(data: any) {
    return this.request('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVendor(id: string, data: any) {
    return this.request(`/api/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteVendor(id: string) {
    return this.request(`/api/vendors/${id}`, {
      method: 'DELETE',
    })
  }

  // Property endpoints
  async getProperties(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/properties?${searchParams.toString()}`)
  }

  async getProperty(id: string) {
    return this.request(`/api/properties/${id}`)
  }

  async createProperty(data: any) {
    return this.request('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProperty(id: string, data: any) {
    return this.request(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProperty(id: string) {
    return this.request(`/api/properties/${id}`, {
      method: 'DELETE',
    })
  }

  // Activity endpoints
  async getActivities(params?: {
    page?: number
    limit?: number
    entityType?: string
    entityId?: string
    action?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request(`/api/activities?${searchParams.toString()}`)
  }

  async getActivity(id: string) {
    return this.request(`/api/activities/${id}`)
  }
}

export const apiClient = new ApiClient()
