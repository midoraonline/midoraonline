"use client";

import { useCallback, useEffect, useState } from "react";
import { apiChat } from "@/lib/api";
import { CHAT_READ_EVENT } from "@/lib/chat/readState";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { useAppSession } from "@/lib/state";

/** Server unread total. Refetches on realtime, focus, and a confirmed mark-read. */
export function useChatUnreadCount(channel: string): number {
  const session = useAppSession();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!session.isAuthenticated) {
      setUnread(0);
      return;
    }
    try {
      const res = await apiChat.getUnreadCount();
      setUnread(res.unread_count ?? 0);
    } catch {
      /* keep last known */
    }
  }, [session.isAuthenticated]);

  useEffect(() => {
    const t = setTimeout(() => void fetchUnread(), 100);
    return () => clearTimeout(t);
  }, [fetchUnread]);

  useEffect(() => {
    const onRead = () => void fetchUnread();
    window.addEventListener(CHAT_READ_EVENT, onRead);
    return () => window.removeEventListener(CHAT_READ_EVENT, onRead);
  }, [fetchUnread]);

  useRealtimeTable(
    {
      table: "conversations",
      channel,
      event: "*",
      enabled: session.isAuthenticated,
    },
    () => {
      void fetchUnread();
    },
  );

  return session.isAuthenticated ? unread : 0;
}
