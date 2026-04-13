import { atom } from "jotai";
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

export const sessionAtom = atom<AppSession>({
  hydrated: false,
  token: null,
  user: null,
  ownedShopIds: [],
  profileError: null,
});
