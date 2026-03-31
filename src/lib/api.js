const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Module-level token — AuthContext sets this, api.js reads it directly.
// This avoids React re-renders and avoids stale closures.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let isRefreshing = false;
let refreshPromise = null;

async function refreshToken() {
  // Deduplicate concurrent refresh attempts
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      accessToken = data.accessToken;
      return data;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;

  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const opts = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  let res = await fetch(url, opts);

  // 401 interceptor — try refresh once, then retry
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    try {
      await refreshToken();
      // Retry with new token
      const retryHeaders = { ...headers, Authorization: `Bearer ${accessToken}` };
      res = await fetch(url, { ...opts, headers: retryHeaders });
    } catch {
      // Refresh failed — force logout handled by AuthContext
      accessToken = null;
      throw new ApiError(401, 'SESSION_EXPIRED', 'Sessão expirada. Faça login novamente.', null);
    }
  }

  // Parse response
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code = data?.error?.code || `HTTP_${res.status}`;
    const message = data?.error?.message || data?.message || 'Erro inesperado.';
    const fields = data?.error?.fields || null;
    throw new ApiError(res.status, code, message, fields);
  }

  return data;
}

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export default api;
