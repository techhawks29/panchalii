const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options;

  // Attach token from localStorage (client-side only)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('panchalii_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // Try token refresh
    const refreshToken = localStorage.getItem('panchalii_refresh_token');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/v1/public/auth/refresh-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('panchalii_access_token', data.tokens.access.token);
        // Retry original request
        return request<T>(path, options);
      } else {
        localStorage.removeItem('panchalii_access_token');
        localStorage.removeItem('panchalii_refresh_token');
        window.location.href = '/auth/login';
      }
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const apiGet = <T>(path: string, init?: RequestOptions) =>
  request<T>(path, { method: 'GET', ...init });

export const apiPost = <T>(path: string, body?: unknown, init?: RequestOptions) =>
  request<T>(path, { method: 'POST', body, ...init });

export const apiPatch = <T>(path: string, body?: unknown, init?: RequestOptions) =>
  request<T>(path, { method: 'PATCH', body, ...init });

export const apiDelete = <T>(path: string, init?: RequestOptions) =>
  request<T>(path, { method: 'DELETE', ...init });

export default { get: apiGet, post: apiPost, patch: apiPatch, delete: apiDelete };
