import axios from "axios";

import { apiAuth, apiShops } from "@/lib/api";
import type { MeResponse, TokenPair } from "@/lib/api/auth";
import { ApiError, apiFetch, apiHttp } from "@/lib/api/base";
import { setGoogleCallbackPending } from "@/lib/auth/google-callback-guard";
import {
  claimSessionWrite,
  currentSessionEpoch,
  isCurrentSessionWrite,
} from "@/lib/auth/session-epoch";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { setRealtimeAuth } from "@/lib/realtime/supabase";
import { useSessionStore } from "@/lib/state/session-store";

const SESSION_ERROR = "Could not establish your session. Please try again.";

function isTransient(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 0 || err.status === 408 || err.status === 429 || err.status >= 500)
  );
}

async function readMe(token?: string): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/v1/auth/me", {
    skipAuthRefresh: true,
    ...(token ? { token } : {}),
  });
}

async function rememberUser(user: MeResponse, accessToken?: string): Promise<void> {
  let ownedShopIds: string[] = [];
  try {
    const mine = await apiShops.myShops();
    ownedShopIds = mine.items.map((shop) => shop.id);
  } catch {
    /* non-merchants or API error */
  }
  claimSessionWrite();
  setRealtimeAuth(user.supabase_realtime_token ?? null);
  useSessionStore.getState().setSession({
    hydrated: true,
    isAuthenticated: true,
    user,
    ownedShopIds,
    profileError: null,
  });
  notifyAuthChanged(accessToken ? { accessToken } : undefined);
}

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

  let user: MeResponse;
  try {
    user = await apiAuth.me(tokens.access_token);
  } catch (err) {
    if (!isCurrentSessionWrite(started)) return;
    if (!isTransient(err)) throw err;
    user = await apiAuth.me(tokens.access_token);
  }
  if (!isCurrentSessionWrite(started)) return;
  if (!user?.id) throw new Error(SESSION_ERROR);

  await rememberUser(user, tokens.access_token);
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
  setGoogleCallbackPending(true);
  if (!googleCallbackSession) {
    googleCallbackSession = redeemApiHostSession()
      .catch((err: unknown) => {
        googleCallbackSession = null;
        throw err;
      })
      .finally(() => {
        setGoogleCallbackPending(false);
      });
  }
  return googleCallbackSession;
}

function tokensFromHash(): TokenPair | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hash = new URLSearchParams(raw);
  const access = hash.get("access_token");
  const refresh = hash.get("refresh_token");
  if (!access || !refresh) return null;
  hash.delete("access_token");
  hash.delete("refresh_token");
  const next = `${window.location.pathname}${window.location.search}${
    hash.toString() ? `#${hash}` : ""
  }`;
  window.history.replaceState(null, "", next);
  return { access_token: access, refresh_token: refresh };
}

async function refreshFromApiHost(): Promise<TokenPair | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  try {
    // Absolute URL skips the same-origin proxy so the API-host cookie is sent.
    const tokens = await apiFetch<TokenPair>(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      body: {},
      skipAuthRefresh: true,
    });
    if (!tokens?.access_token || !tokens.refresh_token) return null;
    return tokens;
  } catch {
    return null;
  }
}

async function redeemApiHostSession(): Promise<void> {
  const hashed = tokensFromHash();
  if (hashed) {
    await establishClientSession(hashed);
    return;
  }

  try {
    const existing = await readMe();
    if (existing?.id) {
      await rememberUser(existing);
      return;
    }
  } catch {
    /* no frontend session yet */
  }

  // Drop a leftover frontend refresh before redeeming. Presenting a revoked
  // one makes the API revoke every token for this user, including Google's.
  try {
    await apiHttp.post("/api/auth/clear-cookies", {}, { withCredentials: true });
  } catch {
    /* still try the API-host cookie */
  }

  let tokens = await refreshFromApiHost();
  if (!tokens) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    tokens = await refreshFromApiHost();
  }
  if (tokens) {
    await establishClientSession(tokens);
    return;
  }

  try {
    const user = await readMe();
    if (user?.id) {
      await rememberUser(user);
      return;
    }
  } catch {
    /* fall through */
  }
  throw new Error(SESSION_ERROR);
}
