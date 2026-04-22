"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client used ONLY for Realtime subscriptions on rows
 * that are safe to expose publicly (see `002_rls_realtime.sql`). All writes
 * and privileged reads still go through the Midora API.
 *
 * IMPORTANT: Next.js only inlines `process.env.NEXT_PUBLIC_*` when the access
 * is a *static* string literal. Dynamic access like `process.env[name]` is
 * NOT inlined in the client bundle and reads as `undefined` — which is why
 * the previous implementation always reported the envs as missing. We read
 * both statically and then fall back across the naming variants.
 */

let _client: SupabaseClient | null = null;
let _warned = false;

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
      // eslint-disable-next-line no-console
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
