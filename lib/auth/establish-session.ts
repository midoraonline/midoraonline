import axios from "axios";

import { apiAuth, apiShops } from "@/lib/api";
import type { TokenPair } from "@/lib/api/auth";
import { apiFetch } from "@/lib/api/base";
import {
  claimSessionWrite,
  currentSessionEpoch,
  isCurrentSessionWrite,
} from "@/lib/auth/session-epoch";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { setRealtimeAuth } from "@/lib/realtime/supabase";
import { useSessionStore } from "@/lib/state/session-store";

const SESSION_ERROR = "Could not establish your session. Please try again.";

/**
 * Mirror tokens onto the Next.js domain, hydrate the client session with an
 * explicit Bearer token (so we do not depend on cookies being visible on the
 * very next tick), then broadcast AUTH_CHANGED for any other listeners.
 */
export async function establishClientSession(tokens: TokenPair): Promise<void> {
  const started = currentSessionEpoch();
  const cookieRes = await axios.post("/api/auth/set-cookies", tokens, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
    validateStatus: () => true,
  });
  if (!isCurrentSessionWrite(started)) return;
  if (cookieRes.status < 200 || cookieRes.status >= 300) {
    throw new Error(SESSION_ERROR);
  }

  let user;
  try {
    user = await apiAuth.me(tokens.access_token);
  } catch (err) {
    if (!isCurrentSessionWrite(started)) return;
    throw err;
  }
  if (!isCurrentSessionWrite(started)) return;
  if (!user?.id) throw new Error(SESSION_ERROR);

  let ownedShopIds: string[] = [];
  try {
    const mine = await apiShops.myShops();
    ownedShopIds = mine.items.map((s) => s.id);
  } catch {
    /* non-merchants or API error */
  }
  if (!isCurrentSessionWrite(started)) return;

  claimSessionWrite();
  setRealtimeAuth(user.supabase_realtime_token ?? null);
  useSessionStore.getState().setSession({
    hydrated: true,
    isAuthenticated: true,
    user,
    ownedShopIds,
    profileError: null,
  });

  notifyAuthChanged({ accessToken: tokens.access_token });
}

const googleCodeSessions = new Map<string, Promise<void>>();

/** Exchange a frontend OAuth code once, even if the callback effect re-runs. */
export function establishSessionFromGoogleCode(code: string, state: string): Promise<void> {
  const key = `${code}:${state}`;
  const existing = googleCodeSessions.get(key);
  if (existing) return existing;

  const pending = (async () => {
    const tokens = await apiAuth.exchangeGoogleCode({ code, state });
    await establishClientSession(tokens);
  })().catch((err: unknown) => {
    googleCodeSessions.delete(key);
    throw err;
  });
  googleCodeSessions.set(key, pending);
  return pending;
}

let googleCallbackSession: Promise<void> | null = null;

// API callback cookies are host-only on the API domain; redeem them, then mirror onto this origin.
export function establishGoogleCallbackSession(): Promise<void> {
  if (!googleCallbackSession) {
    googleCallbackSession = redeemApiHostSession().catch((err: unknown) => {
      googleCallbackSession = null;
      throw err;
    });
  }
  return googleCallbackSession;
}

async function redeemApiHostSession(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  if (!base) throw new Error(SESSION_ERROR);

  let tokens: TokenPair;
  try {
    // Absolute URL skips the same-origin proxy so the API-host cookie is sent.
    tokens = await apiFetch<TokenPair>(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      body: {},
      skipAuthRefresh: true,
    });
  } catch {
    throw new Error(SESSION_ERROR);
  }
  if (!tokens?.access_token || !tokens.refresh_token) {
    throw new Error(SESSION_ERROR);
  }
  await establishClientSession(tokens);
}
