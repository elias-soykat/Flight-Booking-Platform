const API_BASE = '/api/v1';

let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('travelhub_access_token', token);
    } else {
      localStorage.removeItem('travelhub_access_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (currentAuthToken) return currentAuthToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('travelhub_access_token');
  }
  return null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as { error?: ApiError } | null;
    throw new Error(errorData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) => fetchApi<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
};
