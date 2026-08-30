"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { http, LIVE } from "./client";

export type AuthUser = {
  sub: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "BILLING" | "VIEWER";
  status?: string;
  avatarUrl?: string | null;
  hasPanelKey?: boolean;
  pteroUserId?: number | null;
  creditBalance?: number;
  theme?: string;
  twoFactorEnabled?: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  live: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(LIVE);

  const hydrate = async () => {
    if (!LIVE) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await http.get<{ user: AuthUser }>("/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void hydrate();
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await http.post<{ user: AuthUser }>("/auth/login", { email, password });
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await http.post<{ user: AuthUser }>("/auth/register", { name, email, password });
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await http.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, live: LIVE, login, register, logout, refreshUser: hydrate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback when consumed outside the provider (e.g. during tests).
    return {
      user: null,
      loading: false,
      live: false,
      login: async () => {
        throw new Error("Auth not available");
      },
      register: async () => {
        throw new Error("Auth not available");
      },
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return ctx;
}
