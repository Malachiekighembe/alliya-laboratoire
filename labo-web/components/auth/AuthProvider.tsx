"use client";

import * as React from "react";
import { api, User } from "@/lib/api-client";

export interface AuthContextType {
  user: User | null;
  tokens: { access_token: string; refresh_token: string } | null;
  error: string | null;
  ready: boolean;
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
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  // Hydratation client: charger session stockée avant d'autoriser les requêtes/pages
  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const access = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token") || "";
      if (storedUser && access) {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setTokens({ access_token: access, refresh_token: refresh });
        api.setToken(access);
      } else {
        api.setToken(null);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      api.setToken(null);
      setUser(null);
      setTokens(null);
    } finally {
      setReady(true);
    }
  }, []);

  // Toujours synchroniser le token courant sur l'instance API (avant les effets enfants)
  const activeToken = tokens?.access_token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  if (activeToken) {
    api.setToken(activeToken);
  } else if (ready) {
    api.setToken(null);
  }

  // Rafraîchissement automatique des tokens (401 -> refresh -> retry)
  React.useEffect(() => {
    api.setAuthHandlers({
      getRefreshToken: () => (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null),
      onTokens: (next) => {
        localStorage.setItem("access_token", next.access_token);
        localStorage.setItem("refresh_token", next.refresh_token);
        setTokens(next);
        api.setToken(next.access_token);
      },
      onUnauthorized: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        api.setToken(null);
        setTokens(null);
        setUser(null);
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      },
    });
    return () => api.setAuthHandlers(null);
  }, []);

  const login = React.useCallback(async (identifier: string, password: string) => {
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
      return { user: data.user, tokens: { access_token: data.access_token, refresh_token: data.refresh_token } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de connexion";
      setError(msg);
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
      return { user: data.user, tokens: { access_token: data.access_token, refresh_token: data.refresh_token } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l'inscription";
      setError(msg);
      throw e;
    }
  }, []);

  const logout = React.useCallback(async () => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    try { await api.post("/auth/logout", refreshToken ? { refresh_token: refreshToken } : undefined); } catch {}
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
    () => ({ user, tokens, error, ready, login, register, logout, hasPermission, hasRole }),
    [user, tokens, error, ready, login, register, logout, hasPermission, hasRole]
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
