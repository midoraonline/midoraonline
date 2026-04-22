import { create } from "zustand";
import type { MeResponse } from "@/lib/api/auth";

export type AppSession = {
  hydrated: boolean;
  /** True once we've confirmed an auth cookie by successfully calling `/auth/me`. */
  isAuthenticated: boolean;
  /** `undefined` = loading profile while auth state is still settling. */
  user: MeResponse | null | undefined;
  ownedShopIds: string[];
  /** Set when `me()` fails despite an apparent session. */
  profileError: string | null;
};

const initialSession: AppSession = {
  hydrated: false,
  isAuthenticated: false,
  user: null,
  ownedShopIds: [],
  profileError: null,
};

type SessionStore = AppSession & {
  setSession: (patch: Partial<AppSession>) => void;
  resetSession: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialSession,
  setSession: (patch) => set((state) => ({ ...state, ...patch })),
  resetSession: () => set({ ...initialSession, hydrated: true }),
}));

export function getSessionState(): AppSession {
  const s = useSessionStore.getState();
  return {
    hydrated: s.hydrated,
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    ownedShopIds: s.ownedShopIds,
    profileError: s.profileError,
  };
}
