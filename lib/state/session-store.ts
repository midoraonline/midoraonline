import { create } from "zustand";
import type { MeResponse } from "@/lib/api/auth";

export type AppSession = {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: MeResponse | null | undefined;
  ownedShopIds: string[];
  ownedShopSlugs: string[];
  profileError: string | null;
};

const initialSession: AppSession = {
  hydrated: false,
  isAuthenticated: false,
  user: null,
  ownedShopIds: [],
  ownedShopSlugs: [],
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
    ownedShopSlugs: s.ownedShopSlugs,
    profileError: s.profileError,
  };
}
