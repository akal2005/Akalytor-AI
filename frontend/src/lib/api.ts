// API config and helpers

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function getToken(): string | null {
  return localStorage.getItem('manitor_token');
}

export function setToken(token: string) {
  localStorage.setItem('manitor_token', token);
}

export function removeToken() {
  localStorage.removeItem('manitor_token');
}

export function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
}
