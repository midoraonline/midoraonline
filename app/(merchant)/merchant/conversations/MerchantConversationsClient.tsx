"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { sameUserId } from "@/lib/chat/participants";
import { EmptyState, LIST, PageHeader, ROW, formatCount as fmt, relativeTime } from "@/components/dashboard/ui";

type Props = { initialConversations: Conversation[] };

export default function MerchantConversationsClient({ initialConversations }: Props) {
  const session = useAppSession();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    try {
      const list = await apiChat.listConversations();
      setConversations(list);
    } catch {
      // keep last known value
    }
  }, [session.isAuthenticated]);

  useEffect(() => { void load(); }, [load]);

  const sellerConvs = conversations.filter((c) =>
    sameUserId(c.seller_id, session.user?.id),
  );

  const unread = sellerConvs.reduce((sum, c) => sum + c.seller_unread, 0);

  return (
    <div>
      <PageHeader
        title="Conversations"
        description={`${fmt(sellerConvs.length)} conversations with buyers, ${fmt(unread)} unread messages.`}
      />
      {sellerConvs.length === 0 ? (
        <EmptyState message="No buyer conversations yet. Buyers can message you from listing pages." />
      ) : (
        <ul className={LIST}>
          {sellerConvs.map((c) => (
            <li key={c.id}>
              <Link href={`/chat?conversation=${c.id}`} className={ROW}>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${c.seller_unread > 0 ? "font-semibold" : "font-medium"}`}>
                    {c.buyer?.full_name || "Buyer"}
                  </span>
                  <span className="block truncate text-xs text-muted">{c.last_message || "No messages"}</span>
                </span>
                {c.seller_unread > 0 ? (
                  <span className="text-xs font-medium tabular-nums text-accent">{c.seller_unread} new</span>
                ) : null}
                <span
                  className="shrink-0 text-xs tabular-nums text-muted"
                  title={c.last_message_at ? new Date(c.last_message_at).toLocaleString() : undefined}
                >
                  {relativeTime(c.last_message_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
