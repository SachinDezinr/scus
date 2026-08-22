'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (saved) {
        setToken(saved);
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data?.user) {
              setUser(data.user);
            } else {
              localStorage.removeItem('auth_token');
              setToken(null);
              setUser(null);
            }
          })
          .catch(() => {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || 'Login failed' };
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || 'Registration failed' };
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    setToken(null);
    setUser(null);
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      const headers = new Headers(options.headers || {});
      if (currentToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}