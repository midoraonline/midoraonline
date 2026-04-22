"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { apiAuth, apiShops } from "@/lib/api";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/token-storage";
import { useSessionStore } from "@/lib/state/session-store";

/**
 * Phase 3 cookie-based hydration:
 *   1. On mount, call `/auth/me`. The cookie (if present) is sent
 *      automatically because apiFetch uses `credentials: "include"`.
 *   2. If that 401s, apiFetch tries `/auth/refresh` once and retries.
 *   3. When any auth surface (login / register / verify / logout) fires
 *      `AUTH_CHANGED_EVENT`, we re-hydrate.
 */
export default function AppStateProvider({ children }: { children: React.ReactNode }) {
  const runHydrate = useCallback(async () => {
    const { setSession } = useSessionStore.getState();

    setSession({ user: undefined, profileError: null });

    try {
      const user = await apiAuth.me();
      let ownedShopIds: string[] = [];
      try {
        const mine = await apiShops.myShops();
        ownedShopIds = mine.items.map((s) => s.id);
      } catch {
        /* non-merchants or API error */
      }
      setSession({
        hydrated: true,
        isAuthenticated: true,
        user,
        ownedShopIds,
        profileError: null,
      });
    } catch {
      // Any unauthenticated / network error → logged-out state. We suppress
      // the error message for anonymous visitors; if you need it, surface it
      // in the page that actually triggered the auth expectation.
      setSession({
        hydrated: true,
        isAuthenticated: false,
        user: null,
        ownedShopIds: [],
        profileError: null,
      });
    }
  }, []);

  useLayoutEffect(() => {
    void runHydrate();
  }, [runHydrate]);

  useEffect(() => {
    function onAuthChanged() {
      void runHydrate();
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [runHydrate]);

  return <>{children}</>;
}
