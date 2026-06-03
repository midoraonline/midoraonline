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
  table: string;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  channel: string;
  enabled?: boolean;
};

export function useRealtimeTable(
   options: SubscriptionOptions,
   handler: ChangeHandler
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
       }
     );

     channel.subscribe();

     return () => {
       void supabase.removeChannel(channel);
     };
   }, [channelName, table, filter, event, enabled]);
}
