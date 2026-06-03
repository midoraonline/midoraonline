"use client";

import { useShallow } from "zustand/react/shallow";
import type { AppSession } from "./session-store";
import { useSessionStore } from "./session-store";

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
