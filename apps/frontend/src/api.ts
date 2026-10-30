import { TenantContextService } from '../services/api/src/common/tenant-context.service';

// Base API service - will be enhanced to connect to the real backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    sellerId: string;
    storeId: string;
    role: string;
    permissions: string[];
  };
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  return { accessToken: data.accessToken };
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('wyh_auth_token', token);
  } else {
    localStorage.removeItem('wyh_auth_token');
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('wyh_auth_token');
};

export const getCurrentSeller = (): { sellerId: string; storeId: string } | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { sellerId: payload.sellerId, storeId: payload.storeId };
  } catch {
    return null;
  }
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token might be expired, try refresh
    const refreshToken = localStorage.getItem('wyh_refresh_token');
    if (refreshToken) {
      const newAuth = await refreshToken(refreshToken);
      setAuthToken(newAuth.accessToken);
      headers['Authorization'] = `Bearer ${newAuth.accessToken}`;
      return apiFetch(endpoint, { ...options, headers });
    }
    throw new Error('Session expired, please login again');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};