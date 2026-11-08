import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearStoredAuth, readStoredAuth, writeStoredAuth } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = readStoredAuth();
    return stored?.token && stored?.student ? stored : null;
  });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleLost = (event) => {
      setAuth(null);
      setNotice(event.detail?.message || 'Your session ended. Please sign in again.');
    };
    window.addEventListener('ur:auth-lost', handleLost);
    return () => window.removeEventListener('ur:auth-lost', handleLost);
  }, []);

  useEffect(() => {
    if (!auth?.token) return;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((response) => {
        if (cancelled) return;
        const next = { token: auth.token, student: response.data.student };
        setAuth(next);
        writeStoredAuth(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (registrationNumber, password) => {
    const payload = password !== undefined && password !== null ? { registrationNumber, password } : { registrationNumber };
    const response = await api.post('/auth/verify', payload);
    const next = { token: response.data.token, student: response.data.student };
    writeStoredAuth(next);
    setAuth(next);
    setNotice('');
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The local token is cleared regardless.
    } finally {
      clearStoredAuth();
      setAuth(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      student: auth?.student || null,
      token: auth?.token || null,
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
      notice,
      clearNotice: () => setNotice(''),
    }),
    [auth, login, logout, notice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}