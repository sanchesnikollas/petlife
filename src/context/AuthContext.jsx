import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAccessToken, ApiError } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true during initial silent refresh

  const isAuthenticated = !!user;

  // Called after successful login/register/refresh
  const setSession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setSession(res.data);
    return res.data;
  }, [setSession]);

  // Register
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setSession(res.data);
    return res.data;
  }, [setSession]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.del('/auth/logout');
    } catch {
      // Ignore errors — we clear locally regardless
    }
    clearSession();
  }, [clearSession]);

  // Silent refresh on mount (cookie may hold valid refresh token)
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
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
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
