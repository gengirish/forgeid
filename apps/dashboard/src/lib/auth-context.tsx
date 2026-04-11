"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgPlan: string;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, orgId: string) => Promise<void>;
  signup: (data: { org_name: string; org_slug: string; owner_email: string; owner_name: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const STORAGE_KEY = "forgeid_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshTok, setRefreshTok] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((t: string, r: string) => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ t, r })); } catch {}
  }, []);

  const resolveUser = useCallback(async (accessToken: string) => {
    try {
      const [verifyRes, orgRes] = await Promise.all([
        api.verifyToken(accessToken),
        api.getOrg(accessToken),
      ]);
      const claims = verifyRes.claims;
      const org = orgRes.org;
      setUser({
        id: claims.sub,
        email: claims.email ?? "",
        name: claims.email ?? claims.sub,
        role: claims.roles?.[0] ?? "member",
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        orgPlan: org.plan,
      });
    } catch {
      setToken(null);
      setRefreshTok(null);
      setUser(null);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { t, r } = JSON.parse(raw);
        setToken(t);
        setRefreshTok(r);
        resolveUser(t).finally(() => setLoading(false));
        return;
      }
    } catch {}
    setLoading(false);
  }, [resolveUser]);

  const login = useCallback(async (email: string, password: string, orgId: string) => {
    const res = await api.login(email, password, orgId);
    setToken(res.access_token);
    setRefreshTok(res.refresh_token);
    persist(res.access_token, res.refresh_token);
    await resolveUser(res.access_token);
  }, [persist, resolveUser]);

  const signup = useCallback(async (data: { org_name: string; org_slug: string; owner_email: string; owner_name: string }) => {
    const res = await api.createOrg(data);
    const loginRes = await api.login(data.owner_email, "forgeid-demo-2026", res.org.id);
    setToken(loginRes.access_token);
    setRefreshTok(loginRes.refresh_token);
    persist(loginRes.access_token, loginRes.refresh_token);
    await resolveUser(loginRes.access_token);
  }, [persist, resolveUser]);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshTok(null);
    setUser(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ token, refreshToken: refreshTok, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
