"use client";

import { useShallow } from "zustand/react/shallow";
import type { AppSession } from "./session-store";
import { useSessionStore } from "./session-store";

/**
 * Session slice with shallow compare so components only re-render when the
 * fields they actually use change.
 */
export function useAppSession(): AppSession {
  return useSessionStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      isAuthenticated: s.isAuthenticated,
      user: s.user,
      ownedShopIds: s.ownedShopIds,
      profileError: s.profileError,
    }))
  );
}
