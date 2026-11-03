"use client";

import { useCallback, useSyncExternalStore } from "react";
import { updateProfile } from "@/lib/api/auth";
import { useSessionStore } from "@/lib/state/session-store";
import { ALL_UGANDA, readAreaCookie, subscribeArea, writeAreaCookie } from "@/lib/browseArea";

export function useBrowseArea() {
  const saved = useSessionStore((s) => s.user?.preferences?.default_area ?? null);
  const signedIn = useSessionStore((s) => s.isAuthenticated);
  const chosen = useSyncExternalStore(subscribeArea, readAreaCookie, () => null);

  const setArea = useCallback(
    (area: string, remember: boolean) => {
      writeAreaCookie(area);
      if (remember && signedIn) {
        void updateProfile({ preferences: { default_area: area === ALL_UGANDA ? null : area } })
          .then((user) => useSessionStore.getState().setSession({ user }))
          .catch(() => {});
      }
    },
    [signedIn],
  );

  return { area: chosen ?? saved ?? null, saved, setArea, signedIn };
}
