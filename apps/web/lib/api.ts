const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    name: string;
    orgName: string;
    orgSlug: string;
  }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Leads
  async getLeads() {
    return this.request<any>('/leads');
  }

  async getLead(id: string) {
    return this.request<any>(`/leads/${id}`);
  }

  async updateLead(id: string, data: any) {
    return this.request<any>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async convertLead(id: string) {
    return this.request<any>(`/leads/${id}/convert`, { method: 'POST' });
  }

  // Bids
  async createBid(data: any) {
    return this.request<any>('/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBids() {
    return this.request<any>('/bids');
  }

  async getBid(id: string) {
    return this.request<any>(`/bids/${id}`);
  }

  // Quotes
  async createQuote(data: any) {
    return this.request<any>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuotes() {
    return this.request<any>('/quotes');
  }

  async getQuote(id: string) {
    return this.request<any>(`/quotes/${id}`);
  }

  async updateQuote(id: string, data: any) {
    return this.request<any>(`/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async sendQuote(id: string) {
    return this.request<any>(`/quotes/${id}/send`, { method: 'POST' });
  }

  async acceptQuote(id: string) {
    return this.request<any>(`/quotes/${id}/accept`, { method: 'POST' });
  }

  // Jobs
  async getJobs(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any>(`/jobs${query}`);
  }

  async getJob(id: string) {
    return this.request<any>(`/jobs/${id}`);
  }

  async updateJob(id: string, data: any) {
    return this.request<any>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async clockIn(jobId: string) {
    return this.request<any>(`/jobs/${jobId}/clock-in`, { method: 'POST' });
  }

  async clockOut(jobId: string) {
    return this.request<any>(`/jobs/${jobId}/clock-out`, { method: 'POST' });
  }

  // Invoices
  async createInvoice(data: any) {
    return this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoices() {
    return this.request<any>('/invoices');
  }

  async getInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }

  async sendInvoice(id: string) {
    return this.request<any>(`/invoices/${id}/send`, { method: 'POST' });
  }

  async markInvoicePaid(id: string) {
    return this.request<any>(`/invoices/${id}/mark-paid`, { method: 'POST' });
  }

  // Analytics
  async getDashboard() {
    return this.request<any>('/analytics/dashboard');
  }

  async getRevenue(period: string) {
    return this.request<any>(`/analytics/revenue?period=${period}`);
  }

  async getVendorPerformance() {
    return this.request<any>('/analytics/vendors');
  }

  // Campaigns
  async createCampaign(data: any) {
    return this.request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaigns() {
    return this.request<any>('/campaigns');
  }

  async sendCampaign(id: string) {
    return this.request<any>(`/campaigns/${id}/send`, { method: 'POST' });
  }

  // Vendors
  async getVendors() {
    return this.request<any>('/vendors');
  }

  async createVendor(data: any) {
    return this.request<any>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Appointments
  async getAppointments(start?: string, end?: string) {
    const query = start && end ? `?start=${start}&end=${end}` : '';
    return this.request<any>(`/appointments${query}`);
  }

  async createAppointment(data: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
