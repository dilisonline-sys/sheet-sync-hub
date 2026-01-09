import { API_CONFIG } from '@/config/api';
import type { 
  User, 
  DatabaseInstance, 
  DailyCheck, 
  WeeklyCheck,
  CheckStatus 
} from '@/types';

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// ============================================
// Authentication API
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  register: async (email: string, password: string, name: string) => {
    return apiRequest<{ message: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  logout: () => {
    setAuthToken(null);
  },

  getCurrentUser: async () => {
    return apiRequest<User>('/auth/me');
  },
};

// ============================================
// Users API (Admin)
// ============================================

export const usersApi = {
  getAll: async () => {
    return apiRequest<User[]>('/users');
  },

  approve: async (userId: string) => {
    return apiRequest<{ message: string }>(`/users/${userId}/approve`, {
      method: 'PUT',
    });
  },

  reject: async (userId: string) => {
    return apiRequest<{ message: string }>(`/users/${userId}/reject`, {
      method: 'PUT',
    });
  },
};

// ============================================
// Databases API
// ============================================

export const databasesApi = {
  getAll: async () => {
    return apiRequest<DatabaseInstance[]>('/databases');
  },

  getById: async (id: string) => {
    return apiRequest<DatabaseInstance>(`/databases/${id}`);
  },

  create: async (database: Omit<DatabaseInstance, 'id'>) => {
    return apiRequest<DatabaseInstance>('/databases', {
      method: 'POST',
      body: JSON.stringify(database),
    });
  },

  update: async (id: string, database: Partial<DatabaseInstance>) => {
    return apiRequest<DatabaseInstance>(`/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(database),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/databases/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Daily Checks API
// ============================================

export interface DailyCheckInput {
  databaseId: string;
  checkName: string;
  checkDate: string;
  status: CheckStatus;
  value?: string;
  comments?: string;
}

export const dailyChecksApi = {
  getByDate: async (date: string, databaseId?: string) => {
    const params = new URLSearchParams({ date });
    if (databaseId) params.append('database_id', databaseId);
    return apiRequest<DailyCheck[]>(`/daily-checks?${params}`);
  },

  getByDateRange: async (startDate: string, endDate: string, databaseId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (databaseId) params.append('database_id', databaseId);
    return apiRequest<DailyCheck[]>(`/daily-checks?${params}`);
  },

  save: async (checks: DailyCheckInput[]) => {
    return apiRequest<{ message: string; count: number }>('/daily-checks', {
      method: 'POST',
      body: JSON.stringify({ checks }),
    });
  },

  update: async (id: string, check: Partial<DailyCheckInput>) => {
    return apiRequest<DailyCheck>(`/daily-checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(check),
    });
  },
};

// ============================================
// Weekly Checks API
// ============================================

export interface WeeklyCheckInput {
  databaseId: string;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  productionDbSize?: string;
  archiveDbSize?: string;
  schemaSize?: Record<string, string>;
  invalidObjects?: number;
  instanceStartDate?: string;
  tablespaces?: Array<{
    name: string;
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercent: number;
  }>;
}

export const weeklyChecksApi = {
  getByWeek: async (weekNumber: number, year: number, databaseId?: string) => {
    const params = new URLSearchParams({ 
      week: weekNumber.toString(), 
      year: year.toString() 
    });
    if (databaseId) params.append('database_id', databaseId);
    return apiRequest<WeeklyCheck[]>(`/weekly-checks?${params}`);
  },

  getByYear: async (year: number, databaseId?: string) => {
    const params = new URLSearchParams({ year: year.toString() });
    if (databaseId) params.append('database_id', databaseId);
    return apiRequest<WeeklyCheck[]>(`/weekly-checks?${params}`);
  },

  save: async (check: WeeklyCheckInput) => {
    return apiRequest<{ message: string; id: string }>('/weekly-checks', {
      method: 'POST',
      body: JSON.stringify(check),
    });
  },

  update: async (id: string, check: Partial<WeeklyCheckInput>) => {
    return apiRequest<WeeklyCheck>(`/weekly-checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(check),
    });
  },
};

// ============================================
// Health Check API
// ============================================

export const healthApi = {
  check: async () => {
    return apiRequest<{ status: string; database: string }>('/health');
  },
};

// ============================================
// Check if API is available
// ============================================

export const isApiEnabled = () => API_CONFIG.enabled;

export const testConnection = async (): Promise<boolean> => {
  try {
    await healthApi.check();
    return true;
  } catch {
    return false;
  }
};
