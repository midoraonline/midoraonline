"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { apiAuth, apiShops } from "@/lib/api";
import { useSessionStore } from "@/lib/state/session-store";

export default function AppStateProvider({ children }: { children: React.ReactNode }) {
  const runHydrate = useCallback(async (token: string | null) => {
    const { setSession } = useSessionStore.getState();

    if (!token) {
      setSession({
        hydrated: true,
        token: null,
        user: null,
        ownedShopIds: [],
        profileError: null,
      });
      return;
    }

    setSession({
      hydrated: true,
      token,
      user: undefined,
      ownedShopIds: [],
      profileError: null,
    });

    try {
      const user = await apiAuth.me(token);
      let ownedShopIds: string[] = [];
      try {
        const mine = await apiShops.myShops(token);
        ownedShopIds = mine.items.map((s) => s.id);
      } catch {
        /* non-merchants or API error */
      }
      setSession({
        hydrated: true,
        token,
        user,
        ownedShopIds,
        profileError: null,
      });
    } catch (e) {
      const profileError =
        e instanceof Error ? e.message : "Could not load your profile.";
      setSession({
        hydrated: true,
        token,
        user: null,
        ownedShopIds: [],
        profileError,
      });
    }
  }, []);

  useLayoutEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("midora_access_token")
        : null;
    void runHydrate(token);
  }, [runHydrate]);

  useEffect(() => {
    function onAuthChanged() {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("midora_access_token")
          : null;
      void runHydrate(token);
    }
    window.addEventListener("midora-auth-changed", onAuthChanged);
    return () => window.removeEventListener("midora-auth-changed", onAuthChanged);
  }, [runHydrate]);

  return <>{children}</>;
}
