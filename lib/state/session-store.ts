import { create } from "zustand";
import type { MeResponse } from "@/lib/api/auth";

export type AppSession = {
  hydrated: boolean;
  token: string | null;
  /** `undefined` = loading profile while `token` is set */
  user: MeResponse | null | undefined;
  ownedShopIds: string[];
  /** Set when `me()` fails but a token was present */
  profileError: string | null;
};

const initialSession: AppSession = {
  hydrated: false,
  token: null,
  user: null,
  ownedShopIds: [],
  profileError: null,
};

type SessionStore = AppSession & {
  /** Merge partial session (used by hydration and future auth updates). */
  setSession: (patch: Partial<AppSession>) => void;
  resetSession: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialSession,
  setSession: (patch) => set((state) => ({ ...state, ...patch })),
  resetSession: () => set({ ...initialSession }),
}));

/** Read session outside React (e.g. event handlers, one-off sync). */
export function getSessionState(): AppSession {
  const s = useSessionStore.getState();
  return {
    hydrated: s.hydrated,
    token: s.token,
    user: s.user,
    ownedShopIds: s.ownedShopIds,
    profileError: s.profileError,
  };
}
