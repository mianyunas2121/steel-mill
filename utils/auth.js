'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!token || !savedUser) {
          if (!cancelled) setLoading(false);
          return;
        }

        try {
          if (!cancelled) setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        try {
          const res = await api.get('/auth/profile');
          if (!cancelled && res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!cancelled) setUser(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      loginUser: (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Safe fallback during static generation edge-cases
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      loginUser: () => {},
      logout: () => {},
      hasRole: () => false,
    };
  }
  return ctx;
}
