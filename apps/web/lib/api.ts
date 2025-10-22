import { LoginDTO, CreateUserDTO, ApiResponse, AuthResponse } from '@seamless/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(data: CreateUserDTO): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(data: LoginDTO): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Projects endpoints
  async getProjects(params?: Record<string, any>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/projects${query}`);
  }

  async getProject(id: string) {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any) {
    return this.request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks endpoints
  async getTasks(params?: Record<string, any>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/tasks${query}`);
  }

  async getTask(id: string) {
    return this.request(`/api/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_URL);
