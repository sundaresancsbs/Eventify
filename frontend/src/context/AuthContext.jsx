import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount — uses the HTTP-only cookie automatically
  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.data.user);
    return data.data.user; // caller redirects based on returned role
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (details) => {
    const { data } = await api.put('/auth/profile', details);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const changePassword = useCallback(async (passwords) => {
    await api.put('/auth/password', passwords);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    setUser
  }), [user, loading, login, register, logout, updateProfile, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
