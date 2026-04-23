import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAccessToken, setRefreshToken, ApiError } from '../lib/api.js';
import { identify, reset as resetAnalytics } from '../lib/analytics.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const setSession = useCallback((data) => {
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    setUser(data.user);
    if (data.user?.id) identify(data.user.id, { name: data.user.name, plan: data.user.plan });
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    resetAnalytics();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setSession(res.data);
    return res.data;
  }, [setSession]);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setSession(res.data);
    return res.data;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await api.del('/auth/logout');
    } catch {
      // Ignore
    }
    clearSession();
  }, [clearSession]);

  // Silent refresh on mount
  useEffect(() => {
    let cancelled = false;
    async function silentRefresh() {
      try {
        const res = await api.post('/auth/refresh');
        if (!cancelled) setSession(res.data);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    silentRefresh();
    return () => { cancelled = true; };
  }, [setSession, clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
