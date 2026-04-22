"use client";

import { useEffect, useRef } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabase";

type TableRow = Record<string, unknown>;
type ChangeHandler = (payload: RealtimePostgresChangesPayload<TableRow>) => void;

type SubscriptionOptions = {
  /** Postgres table name in the `public` schema. */
  table: string;
  /** Optional `column=value` filter (Supabase Realtime syntax). */
  filter?: string;
  /** Which change events to subscribe to. Defaults to all. */
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  /** Unique channel name so independent subscribers don't collide. */
  channel: string;
  /** Whether the subscription should be active. Handy for guarding on auth. */
  enabled?: boolean;
};

/**
 * Subscribe to Postgres change events over Supabase Realtime. The handler is
 * kept in a ref so consumers don't need to memoise it for stable references.
 *
 * Silently no-ops if the Supabase browser client isn't configured (missing
 * env vars). This lets pages render without realtime in dev without
 * exploding.
 */
export function useRealtimeTable(
  options: SubscriptionOptions,
  handler: ChangeHandler
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const { table, filter, event = "*", channel: channelName, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel: RealtimeChannel = supabase.channel(channelName);
    channel.on(
      // supabase-js requires loose typing here; the second arg is strictly
      // validated by the server regardless.
      "postgres_changes" as never,
      {
        event,
        schema: "public",
        table,
        ...(filter ? { filter } : {}),
      },
      (payload: RealtimePostgresChangesPayload<TableRow>) => {
        handlerRef.current(payload);
      }
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, event, enabled]);
}
