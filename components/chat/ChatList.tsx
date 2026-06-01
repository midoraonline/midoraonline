"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  activeId?: string;
  onSelect: (id: string) => void;
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
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
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session.isAuthenticated]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Poll for new conversations / unread updates every 10s
  useEffect(() => {
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [fetchList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Loading conversations...
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted">
        <MaterialSymbol name="chat" className="!text-3xl mb-2 opacity-30" />
        <p>No conversations yet</p>
        <p className="text-xs mt-1">Message a seller from any product page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {conversations.map((conv) => {
        const isBuyer = session.user?.id === conv.buyer_id;
        const otherUser = isBuyer ? conv.seller : conv.buyer;
        const unread = isBuyer ? conv.buyer_unread : conv.seller_unread;
        const active = conv.id === activeId;

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors dm-focus ${
              active
                ? "bg-accent/10 ring-1 ring-accent/30"
                : "hover:bg-foreground/[0.04]"
            }`}
          >
            <div className="relative size-10 shrink-0 rounded-full bg-foreground/[0.06] flex items-center justify-center text-sm font-bold text-muted">
              {(otherUser?.full_name?.charAt(0) || "?").toUpperCase()}
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold">
                  {otherUser?.full_name || "Unknown"}
                </p>
                <span className="shrink-0 text-[10px] text-muted">
                  {timeAgo(conv.last_message_at)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">
                {conv.last_message || "No messages yet"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
