"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _warned = false;
let _currentAuthToken: string | null = null;

function pickKey(): string | undefined {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof anonKey === "string" && anonKey.trim().length > 0) return anonKey;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (typeof publishable === "string" && publishable.trim().length > 0) return publishable;
  return undefined;
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = pickKey();

  if (!url || !anonKey) {
    if (!_warned && typeof window !== "undefined") {
      _warned = true;
      console.warn(
        "[midora] Supabase realtime disabled: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
      );
    }
    return null;
  }

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
  return _client;
}

export function isRealtimeAvailable(): boolean {
  return getSupabaseBrowser() !== null;
}

/**
 * Attach (or clear) the current user's Supabase Realtime JWT.
 *
 * The token must be signed with the same secret Supabase uses for JWTs
 * and carry `role: "authenticated"` so RLS binds to `auth.uid()`. Realtime
 * subscribers then only receive rows their SELECT policy allows.
 *
 * Pass `null` on sign-out to revert to anon.
 */
export function setRealtimeAuth(token: string | null): void {
  const client = getSupabaseBrowser();
  if (!client) return;
  if (_currentAuthToken === token) return;
  _currentAuthToken = token;
  // Supabase's client accepts an empty string to clear the auth token.
  client.realtime.setAuth(token ?? "");
}

export function getRealtimeAuth(): string | null {
  return _currentAuthToken;
}
