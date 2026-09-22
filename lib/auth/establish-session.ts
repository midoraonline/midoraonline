import axios from "axios";

import { apiAuth, apiShops } from "@/lib/api";
import type { TokenPair } from "@/lib/api/auth";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { setRealtimeAuth } from "@/lib/realtime/supabase";
import { useSessionStore } from "@/lib/state/session-store";

/**
 * Mirror tokens onto the Next.js domain, hydrate the client session with an
 * explicit Bearer token (so we do not depend on cookies being visible on the
 * very next tick), then broadcast AUTH_CHANGED for any other listeners.
 */
export async function establishClientSession(tokens: TokenPair): Promise<void> {
  const cookieRes = await axios.post("/api/auth/set-cookies", tokens, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
    validateStatus: () => true,
  });
  if (cookieRes.status < 200 || cookieRes.status >= 300) {
    throw new Error("Could not establish your session. Please try again.");
  }

  const user = await apiAuth.me(tokens.access_token);
  let ownedShopIds: string[] = [];
  try {
    // Prefer cookie-backed call now that set-cookies completed; fall back is N/A.
    const mine = await apiShops.myShops();
    ownedShopIds = mine.items.map((s) => s.id);
  } catch {
    /* non-merchants or API error */
  }

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
