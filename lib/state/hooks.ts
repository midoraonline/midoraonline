"use client";

import { useShallow } from "zustand/react/shallow";
import type { AppSession } from "./session-store";
import { useSessionStore } from "./session-store";

/**
 * Session slice with shallow compare — same ergonomics as the previous Jotai atom,
 * without re-rendering when unrelated store fields change (once we add more slices).
 */
export function useAppSession(): AppSession {
  return useSessionStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      token: s.token,
      user: s.user,
      ownedShopIds: s.ownedShopIds,
      profileError: s.profileError,
    }))
  );
}
