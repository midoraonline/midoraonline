"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import { apiAuth } from "@/lib/api";
import type { LoginRequest, MeResponse, RegisterRequest } from "@/lib/api/auth";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import type { AppSession } from "@/lib/state/session-store";
import { useSessionStore } from "@/lib/state/session-store";
import { track } from "@/lib/analytics";

/**
 * Public shape consumed by `useAuth()`.
 *
 * Session state comes straight from Zustand (single source of truth per
 * AGENTS.md §6). The Context adds a stable **actions** surface so login/
 * register/logout/refresh look the same everywhere and analytics events
 * (`merchant:verification_*`, sign-in outcomes, …) are emitted in one
 * place instead of being duplicated at each call site.
 *
 * The `value` object identity is stabilized with `useMemo` so consumers
 * that don't touch actions don't re-render on unrelated store updates.
 */
export type AuthContextValue = AppSession & {
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isMerchant: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider is trivial on purpose: it never fetches, never subscribes to
 * anything except the existing Zustand store. All hydration still lives in
 * `AppStateProvider` — which means this Context can be added or removed
 * without touching auth wiring elsewhere.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSessionStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      isAuthenticated: s.isAuthenticated,
      user: s.user,
      ownedShopIds: s.ownedShopIds,
      profileError: s.profileError,
    })),
  );

  const login = useCallback(async (input: LoginRequest) => {
    await apiAuth.login(input);
    notifyAuthChanged();
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    await apiAuth.register(input);
    notifyAuthChanged();
  }, []);

  const logout = useCallback(async () => {
    await apiAuth.logout();
    notifyAuthChanged();
  }, []);

  const refresh = useCallback(async () => {
    notifyAuthChanged();
  }, []);

  const role = session.user?.user_role ?? null;
  const isAdmin = role === "admin" || role === "staff";
  const isMerchant = role === "merchant";

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, login, register, logout, refresh, isAdmin, isMerchant }),
    [session, login, register, logout, refresh, isAdmin, isMerchant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Read the auth context. Throws if used outside `<AuthProvider>` so misuse
 * is caught at dev-time rather than silently returning null.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

/** Convenience: current user, or null when unauthenticated / hydrating. */
export function useAuthUser(): MeResponse | null | undefined {
  return useAuth().user;
}

// Emit merchant-verification start so the admin funnel can measure drop-off.
// This is a small helper so pages don't need to import the analytics module
// directly just to log one event.
export function trackVerificationStarted(shopId?: string, stage?: number) {
  track("merchant:verification_started", { shopId, stage });
}
