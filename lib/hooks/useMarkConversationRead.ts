"use client";

import { useEffect } from "react";
import { unreadForViewer, type UnreadSides } from "@/lib/chat/participants";
import { persistConversationRead } from "@/lib/chat/readState";
import { useRealtimeTable } from "@/lib/realtime/hooks";

const RETRY_MS = 800;

/**
 * Persist read while this thread is on screen.
 * A delayed retry covers `increment_unread` landing after the first PUT.
 */
export function useMarkConversationRead(
  conversationId: string,
  viewerId: string | null | undefined,
): void {
  useEffect(() => {
    let cancelled = false;
    let sawVisible = document.visibilityState === "visible";

    const markIfVisible = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      sawVisible = true;
      void persistConversationRead(conversationId);
    };

    markIfVisible();
    const retry = window.setTimeout(markIfVisible, RETRY_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") markIfVisible();
    };
    const onPageHide = () => {
      if (!sawVisible) return;
      void persistConversationRead(conversationId);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [conversationId]);

  useRealtimeTable(
    {
      table: "conversations",
      filter: `id=eq.${conversationId}`,
      channel: `chat-readsync-${conversationId}`,
      event: "UPDATE",
    },
    (payload) => {
      if (document.visibilityState !== "visible") return;
      const row = payload.new as UnreadSides;
      if (!row?.buyer_id || !row?.seller_id) return;
      if (unreadForViewer(row, viewerId) > 0) {
        void persistConversationRead(conversationId);
      }
    },
  );
}
