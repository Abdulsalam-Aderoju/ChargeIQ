import { useState, useEffect, useCallback } from 'react';
import * as auth from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = auth.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, role) => {
    const u = auth.login(email, password, role);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email, password, role) => {
    const u = auth.signup(email, password, role);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  return {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading,
  };
}
