"use client";

import * as React from "react";
import { api, User } from "@/lib/api-client";

export interface AuthContextType {
  user: User | null;
  tokens: { access_token: string; refresh_token: string } | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<{ user: User; tokens: { access_token: string; refresh_token: string } }>;
  register: (dto: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    laboratory_id?: string;
    role_ids?: string[];
  }) => Promise<{ user: User; tokens: { access_token: string; refresh_token: string } }>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [tokens, setTokens] = React.useState<{ access_token: string; refresh_token: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Restaurer la session depuis localStorage au montage (persistance entre les navigations)
  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");
    if (token) {
      api.setToken(token);
      setTokens({ access_token: token, refresh_token: refreshToken || "" });
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = React.useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
        email: identifier,
        password,
      });
      const data = res.data;
      api.setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
      setLoading(false);
      return { user: data.user, tokens: { access_token: data.access_token, refresh_token: data.refresh_token } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de connexion";
      setError(msg);
      setLoading(false);
      throw e;
    }
  }, []);

  const register = React.useCallback(async (dto: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    laboratory_id?: string;
    role_ids?: string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ access_token: string; refresh_token: string; user: User }>("/auth/register", dto);
      const data = res.data;
      api.setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
      setLoading(false);
      return { user: data.user, tokens: { access_token: data.access_token, refresh_token: data.refresh_token } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l'inscription";
      setError(msg);
      setLoading(false);
      throw e;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try { await api.post("/auth/logout"); } catch {}
    api.setToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setTokens(null);
    setError(null);
  }, []);

  const hasPermission = React.useCallback((perm: string): boolean => !!user && user.permissions.includes(perm), [user]);
  const hasRole = React.useCallback((role: string): boolean => !!user && user.roles.includes(role), [user]);

  const value = React.useMemo<AuthContextType>(
    () => ({ user, tokens, loading, error, login, register, logout, hasPermission, hasRole }),
    [user, tokens, loading, error, login, register, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return ctx;
}
