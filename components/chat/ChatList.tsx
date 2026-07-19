"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { usePresence, useRealtimeTable } from "@/lib/realtime/hooks";

type Props = {
  activeId?: string;
  onSelect: (id: string) => void;
};

type PresenceState = { user_id: string };

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function truncate(s: string | null | undefined, n = 60): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export default function ChatList({ activeId, onSelect }: Props) {
  const session = useAppSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const list = await apiChat.listConversations();
      setConversations(list);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [session.isAuthenticated]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useRealtimeTable(
    {
      table: "conversations",
      channel: "chat-list-conversations",
      event: "*",
      enabled: session.isAuthenticated,
    },
    () => {
      void fetchList();
    },
  );

  // Global presence: figure out which counterparties are online right now.
  const presenceState = useMemo<PresenceState | null>(
    () => (session.user ? { user_id: session.user.id } : null),
    [session.user],
  );
  const presenceSnapshot = usePresence({
    channel: "midora:presence:global",
    state: presenceState,
    enabled: !!session.user,
  });
  const onlineIds = useMemo(() => {
    const ids = new Set<string>();
    for (const list of Object.values(presenceSnapshot)) {
      for (const s of list) {
        if (s?.user_id) ids.add(s.user_id);
      }
    }
    return ids;
  }, [presenceSnapshot]);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Loading conversations…
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted">
        <MaterialSymbol name="chat" className="!text-3xl mb-2 opacity-30" />
        <p>No conversations yet</p>
        <p className="mt-1 text-xs">
          Message a seller from any product page to start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {conversations.map((conv) => {
        const isBuyer = session.user?.id === conv.buyer_id;
        const otherUser = isBuyer ? conv.seller : conv.buyer;
        const otherId = isBuyer ? conv.seller_id : conv.buyer_id;
        const unread = isBuyer ? conv.buyer_unread : conv.seller_unread;
        const active = conv.id === activeId;
        const isOnline = onlineIds.has(otherId);

        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className={[
                "dm-focus flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                active
                  ? "bg-accent/10 ring-1 ring-accent/30"
                  : "hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              <div className="relative shrink-0">
                <div className="grid size-10 place-items-center rounded-full bg-foreground/[0.06] text-sm font-bold text-muted">
                  {(otherUser?.full_name?.charAt(0) || "?").toUpperCase()}
                </div>
                <span
                  aria-hidden
                  className={[
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
                    isOnline ? "bg-emerald-500" : "bg-foreground/25",
                  ].join(" ")}
                />
                {unread > 0 && (
                  <span
                    className="absolute -right-1 -top-1 grid min-w-[18px] h-[18px] place-items-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm"
                    style={{ background: "var(--error)" }}
                    aria-label={`${unread} unread`}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={[
                      "truncate text-sm",
                      unread > 0 ? "font-bold" : "font-semibold",
                    ].join(" ")}
                  >
                    {otherUser?.full_name || "Unknown"}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted">
                    {timeAgo(conv.last_message_at)}
                  </span>
                </div>
                <p
                  className={[
                    "mt-0.5 truncate text-xs",
                    unread > 0 ? "text-foreground" : "text-muted",
                  ].join(" ")}
                >
                  {truncate(conv.last_message) || "No messages yet"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
