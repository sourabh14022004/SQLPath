'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getUser, saveAuth, clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (body: any) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Record<string, any>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (t && u) { setToken(t); setUser(u); }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    saveAuth(res.access_token, res.user);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (body: any) => {
    const res = await api.register(body);
    saveAuth(res.access_token, res.user);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch: Record<string, any>) => {
    setUser((prev: any) => {
      const next = { ...prev, ...patch };
      if (token) saveAuth(token, next);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
