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

type PresenceListener = (snap: Record<string, PresenceMeta[]>) => void;

type PresenceRoom = {
  channel: RealtimeChannel;
  refs: number;
  listeners: Set<PresenceListener>;
  snapshot: Record<string, PresenceMeta[]>;
  lastTracked: string;
  subscribed: boolean;
};

/** One Realtime channel per name — navbar + chat share without wiping each other. */
const presenceRooms = new Map<string, PresenceRoom>();

function notifyPresenceListeners(room: PresenceRoom) {
  for (const listener of room.listeners) {
    listener(room.snapshot);
  }
}

function trackPresenceState(room: PresenceRoom, state: PresenceMeta | null) {
  const payload = state ?? ({ role: "guest" } as PresenceMeta);
  const serialized = JSON.stringify(payload);
  if (serialized === room.lastTracked && room.subscribed) return;
  room.lastTracked = serialized;
  if (!room.subscribed) return;
  void room.channel.track(payload);
}

function acquirePresenceRoom(channelName: string): PresenceRoom {
  const existing = presenceRooms.get(channelName);
  if (existing) {
    existing.refs += 1;
    return existing;
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("Supabase browser client unavailable");
  }

  const clientKey = getPresenceClientKey();
  const channel = supabase.channel(channelName, {
    config: { presence: { key: clientKey } },
  });

  const room: PresenceRoom = {
    channel,
    refs: 1,
    listeners: new Set(),
    snapshot: {},
    lastTracked: "",
    subscribed: false,
  };

  channel.on("presence", { event: "sync" }, () => {
    room.snapshot = channel.presenceState() as Record<string, PresenceMeta[]>;
    notifyPresenceListeners(room);
  });

  channel.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    room.subscribed = true;
    if (room.lastTracked) {
      try {
        void channel.track(JSON.parse(room.lastTracked) as PresenceMeta);
      } catch {
        void channel.track({ role: "guest" });
      }
    }
  });

  presenceRooms.set(channelName, room);
  return room;
}

function releasePresenceRoom(channelName: string, listener: PresenceListener) {
  const room = presenceRooms.get(channelName);
  if (!room) return;
  room.listeners.delete(listener);
  room.refs -= 1;
  if (room.refs > 0) return;
  presenceRooms.delete(channelName);
  const supabase = getSupabaseBrowser();
  if (supabase) void supabase.removeChannel(room.channel);
}

/**
 * Join a Supabase presence channel and return the current merged state.
 *
 * Sign-in updates only re-`track()` metadata — they do **not** tear down the
 * channel (that previously zeroed the mobile online count on auth).
 */
export function usePresence<M extends PresenceMeta>(
  opts: PresenceOptions<M>,
): Record<string, M[]> {
  const { channel: channelName, state, enabled = true } = opts;
  const [snapshot, setSnapshot] = useState<Record<string, M[]>>({});
  const stateKey = JSON.stringify(state ?? { role: "guest" });

  useEffect(() => {
    if (!enabled) {
      setSnapshot({});
      return;
    }
    if (!getSupabaseBrowser()) return;

    let room: PresenceRoom;
    try {
      room = acquirePresenceRoom(channelName);
    } catch {
      return;
    }

    const listener: PresenceListener = (snap) => {
      setSnapshot(snap as Record<string, M[]>);
    };
    room.listeners.add(listener);
    setSnapshot(room.snapshot as Record<string, M[]>);
    trackPresenceState(room, (state ?? { role: "guest" }) as PresenceMeta);

    return () => {
      releasePresenceRoom(channelName, listener);
    };
    // Channel lifetime is independent of presence metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const room = presenceRooms.get(channelName);
    if (!room) return;
    trackPresenceState(room, (state ?? { role: "guest" }) as PresenceMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, stateKey]);

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
