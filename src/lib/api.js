const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let accessToken = null;
let refreshTokenValue = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setRefreshToken(token) {
  refreshTokenValue = token;
}

export function getAccessToken() {
  return accessToken;
}

let isRefreshing = false;
let refreshPromise = null;

async function doRefresh() {
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const json = await res.json();
      const data = json.data || json;
      accessToken = data.accessToken;
      if (data.refreshToken) refreshTokenValue = data.refreshToken;
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
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/register') {
    try {
      await doRefresh();
      const retryHeaders = { ...headers, Authorization: `Bearer ${accessToken}` };
      res = await fetch(url, { ...opts, headers: retryHeaders });
    } catch {
      accessToken = null;
      refreshTokenValue = null;
      throw new ApiError(401, 'SESSION_EXPIRED', 'Sessão expirada. Faça login novamente.', null);
    }
  }

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
