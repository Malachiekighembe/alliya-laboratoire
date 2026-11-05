"use client";
import { useState, useEffect, useCallback } from 'react';
import { api, User } from '../lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem('alliya_token');
    const storedUser = localStorage.getItem('alliya_user');
    if (stored && storedUser) {
      api.setToken(stored);
      setState({
        user: JSON.parse(storedUser),
        token: stored,
        loading: false,
        error: null,
      });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (laboratory_id: string, email: string, password: string, device_id?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
        laboratory_id, email, password, device_id,
      });
      if (!res.success) throw new Error(res.message || 'Échec de connexion');
      const { access_token, user } = res.data;
      api.setToken(access_token);
      localStorage.setItem('alliya_token', access_token);
      localStorage.setItem('alliya_user', JSON.stringify(user));
      setState({ user, token: access_token, loading: false, error: null });
      return user;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec de connexion';
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem('alliya_token');
    localStorage.removeItem('alliya_user');
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const hasPermission = useCallback((perm: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(perm);
  }, [state.user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!state.user) return false;
    return state.user.roles.includes(role);
  }, [state.user]);

  return { ...state, login, logout, hasPermission, hasRole };
}