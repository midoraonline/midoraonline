"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabase";

type TableRow = Record<string, unknown>;
type ChangeHandler = (payload: RealtimePostgresChangesPayload<TableRow>) => void;

type SubscriptionOptions = {
  table: string;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  channel: string;
  enabled?: boolean;
};

/**
 * Subscribe to Postgres row changes. RLS on the underlying table determines
 * which rows the current user's Realtime JWT is authorised to see.
 */
export function useRealtimeTable(
  options: SubscriptionOptions,
  handler: ChangeHandler,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const { table, filter, event = "*", channel: channelName, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase.channel(channelName);
    channel.on(
      "postgres_changes" as never,
      {
        event,
        schema: "public",
        table,
        ...(filter ? { filter } : {}),
      },
      (payload: RealtimePostgresChangesPayload<TableRow>) => {
        handlerRef.current(payload);
      },
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, event, enabled]);
}

// ---------------------------------------------------------------------------
// Broadcast — client-to-client events without touching the database. Ideal
// for ephemeral signals like typing indicators, cursor pings, or reactions.
// ---------------------------------------------------------------------------

type BroadcastOptions<T> = {
  channel: string;
  event: string;
  enabled?: boolean;
  onMessage?: (payload: T) => void;
};

type BroadcastSender<T> = (payload: T) => void;

/**
 * Subscribe to broadcast events on a channel and return a `send()` function
 * for pushing events of the same shape. The channel is joined only once per
 * (channel, event, enabled) tuple.
 */
export function useBroadcast<T>(opts: BroadcastOptions<T>): BroadcastSender<T> {
  const { channel: channelName, event, enabled = true, onMessage } = opts;

  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const ch = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = ch;

    ch.on("broadcast", { event }, (msg) => {
      handlerRef.current?.((msg as unknown as { payload: T }).payload);
    });
    ch.subscribe();

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [channelName, event, enabled]);

  return useMemo<BroadcastSender<T>>(
    () => (payload) => {
      const ch = channelRef.current;
      if (!ch) return;
      void ch.send({ type: "broadcast", event, payload });
    },
    [event],
  );
}

// ---------------------------------------------------------------------------
// Presence — track connected clients on a shared channel. Each client
// contributes a small state object; the hook returns the merged snapshot.
// ---------------------------------------------------------------------------

type PresenceMeta = Record<string, unknown>;

type PresenceOptions<M extends PresenceMeta> = {
  channel: string;
  state: M | null;
  enabled?: boolean;
};

const PRESENCE_KEY_STORAGE = "midora:presence:client_id";

/**
 * Stable per-tab presence key. Every browser tab gets a unique UUID so that
 * Supabase's `presenceState()` returns one bucket per tab — this is what
 * `usePresenceCount` counts. Falls back to an in-memory value if
 * sessionStorage is unavailable (private mode).
 */
function getPresenceClientKey(): string {
  if (typeof window === "undefined") {
    return `srv-${Math.random().toString(36).slice(2, 12)}`;
  }
  try {
    const existing = window.sessionStorage.getItem(PRESENCE_KEY_STORAGE);
    if (existing) return existing;
    const uuid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.sessionStorage.setItem(PRESENCE_KEY_STORAGE, uuid);
    return uuid;
  } catch {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * Join a Supabase presence channel and return the current merged state.
 *
 * The returned map is keyed by a stable per-tab UUID; each entry is the
 * array of `state` payloads that key contributed. Anonymous visitors are
 * tracked with `{ role: "guest" }` so they still show up in the count.
 *
 * Passing `enabled: false` leaves the channel entirely.
 */
export function usePresence<M extends PresenceMeta>(
  opts: PresenceOptions<M>,
): Record<string, M[]> {
  const { channel: channelName, state, enabled = true } = opts;
  const [snapshot, setSnapshot] = useState<Record<string, M[]>>({});

  useEffect(() => {
    if (!enabled) {
      setSnapshot({});
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const clientKey = getPresenceClientKey();
    const ch = supabase.channel(channelName, {
      config: { presence: { key: clientKey } },
    });

    ch.on("presence", { event: "sync" }, () => {
      setSnapshot(ch.presenceState() as Record<string, M[]>);
    });

    ch.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      // Always track — even anonymous visitors count.
      void ch.track(state ?? ({ role: "guest" } as unknown as M));
    });

    return () => {
      setSnapshot({});
      void supabase.removeChannel(ch);
    };
    // Serialise `state` so referentially-different-but-equal objects don't
    // re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, JSON.stringify(state)]);

  return snapshot;
}

/**
 * Count the number of unique presence keys currently on `channel`.
 * Convenience helper for "N users online" indicators.
 */
export function usePresenceCount(
  channel: string,
  state: PresenceMeta | null,
  enabled = true,
): number {
  const snap = usePresence({ channel, state, enabled });
  return Object.keys(snap).length;
}

/**
 * Breakdown of who is currently on `channel` — total, authenticated users,
 * anonymous guests, and available merchants. Used by admin/merchant surfaces
 * to give a richer "online" indicator than a single number.
 */
export function usePresenceBreakdown(
  channel: string,
  state: PresenceMeta | null,
  enabled = true,
): {
  total: number;
  authenticated: number;
  guests: number;
  merchants: number;
  availableMerchants: number;
} {
  const snap = usePresence(
    { channel, state, enabled },
  ) as Record<string, Array<Record<string, unknown>>>;
  let authenticated = 0;
  let guests = 0;
  let merchants = 0;
  let availableMerchants = 0;
  for (const entries of Object.values(snap)) {
    const meta = entries[0] ?? {};
    const role = String(meta.role ?? "guest");
    if (meta.user_id) authenticated += 1;
    else guests += 1;
    if (role === "merchant") merchants += 1;
    if (role === "merchant" && meta.available === true) availableMerchants += 1;
  }
  return {
    total: Object.keys(snap).length,
    authenticated,
    guests,
    merchants,
    availableMerchants,
  };
}
