"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { SWRConfig } from "swr";
import { apiAuth, apiShops } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { currentSessionEpoch, isCurrentSessionWrite } from "@/lib/auth/session-epoch";
import {
  AUTH_CHANGED_EVENT,
  type AuthChangedDetail,
} from "@/lib/auth/token-storage";
import { setRealtimeAuth } from "@/lib/realtime/supabase";
import { useSessionStore } from "@/lib/state/session-store";

// Supabase realtime JWTs live 60 min server-side; re-fetch /me every 30 min
// while the tab is open so the token never expires mid-session.
const REALTIME_REFRESH_MS = 30 * 60 * 1000;

export default function AppStateProvider({ children }: { children: React.ReactNode }) {
  const runHydrate = useCallback(async (accessToken?: string) => {
    const started = currentSessionEpoch();
    const { setSession, isAuthenticated, user: existing } = useSessionStore.getState();
    if (!isCurrentSessionWrite(started)) return;
    // Login already stored this user. Another /me here only delays the next paint.
    if (accessToken && isAuthenticated && existing) return;

    // Do not wipe an authenticated user to `undefined` before /me returns —
    // that race made post-login UI flash as signed-out on Vercel.
    if (!isAuthenticated) {
      setSession({ user: undefined, profileError: null });
    } else {
      setSession({ profileError: null });
    }

    const shopsPromise = apiShops
      .myShops()
      .then((mine) => mine.items.map((s) => s.id))
      .catch(() => [] as string[]);

    try {
      const user = await apiAuth.me(accessToken);
      if (!isCurrentSessionWrite(started)) return;
      const ownedShopIds = await shopsPromise;
      if (!isCurrentSessionWrite(started)) return;
      setRealtimeAuth(user.supabase_realtime_token ?? null);
      setSession({
        hydrated: true,
        isAuthenticated: true,
        user,
        ownedShopIds,
        profileError: null,
      });
    } catch (err) {
      if (!isCurrentSessionWrite(started)) return;
      const current = useSessionStore.getState();
      const transient =
        err instanceof ApiError && (err.status === 0 || err.status >= 500);
      if (current.isAuthenticated && current.user && transient) {
        setSession({ hydrated: true, profileError: null });
        return;
      }
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
    function onAuthChanged(event: Event) {
      const detail = (event as CustomEvent<AuthChangedDetail>).detail;
      void runHydrate(detail?.accessToken);
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

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 4_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
