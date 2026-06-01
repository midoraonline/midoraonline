"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function MerchantConversationsPage() {
  const session = useAppSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const list = await apiChat.listConversations();
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [session.isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">Loading conversations...</p>;
  }

  const sellerConvs = conversations.filter((c) => c.seller_id === session.user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Conversations</h1>
        <p className="mt-1 text-sm text-muted">Messages from buyers interested in your products.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="dm-card p-4">
          <p className="text-2xl font-semibold">{sellerConvs.length}</p>
          <p className="text-xs text-muted">Active Conversations</p>
        </div>
        <div className="dm-card p-4">
          <p className="text-2xl font-semibold">
            {sellerConvs.reduce((sum, c) => sum + c.seller_unread, 0)}
          </p>
          <p className="text-xs text-muted">Unread Messages</p>
        </div>
      </div>

      {sellerConvs.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">
          No customer conversations yet. Buyers can message you from product pages.
        </div>
      ) : (
        <div className="space-y-2">
          {sellerConvs.map((c) => (
            <Link
              key={c.id}
              href={`/chat?conversation=${c.id}`}
              className="dm-card dm-card-hover flex items-center gap-4 p-4"
            >
              <div className="relative size-10 shrink-0 rounded-full bg-foreground/[0.06] flex items-center justify-center text-sm font-bold text-muted">
                {(c.buyer?.full_name?.charAt(0) || "?").toUpperCase()}
                {c.seller_unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {c.seller_unread > 9 ? "9+" : c.seller_unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.buyer?.full_name || "Unknown"}</p>
                <p className="truncate text-xs text-muted">{c.last_message || "No messages"}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted">
                {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
