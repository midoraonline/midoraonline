"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { apiAuth, apiShops } from "@/lib/api";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/token-storage";
import { setRealtimeAuth } from "@/lib/realtime/supabase";
import { useSessionStore } from "@/lib/state/session-store";

// Supabase realtime JWTs live 60 min server-side; re-fetch /me every 30 min
// while the tab is open so the token never expires mid-session.
const REALTIME_REFRESH_MS = 30 * 60 * 1000;

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
      setRealtimeAuth(user.supabase_realtime_token ?? null);
      setSession({
        hydrated: true,
        isAuthenticated: true,
        user,
        ownedShopIds,
        profileError: null,
      });
    } catch {
      setRealtimeAuth(null);
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

  // Periodic silent re-hydrate to refresh the Supabase realtime JWT.
  useEffect(() => {
    const id = window.setInterval(() => {
      const { isAuthenticated } = useSessionStore.getState();
      if (isAuthenticated) void runHydrate();
    }, REALTIME_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [runHydrate]);

  return <>{children}</>;
}
