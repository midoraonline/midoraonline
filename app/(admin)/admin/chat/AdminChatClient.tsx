"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminConversation } from "@/lib/api/admin";
import { EmptyState, LIST, PageHeader, formatCount as fmt, relativeTime } from "@/components/dashboard/ui";

type Props = {
  initialConversations: AdminConversation[];
  initialMessageCount: number;
};

export default function AdminChatClient({
  initialConversations,
  initialMessageCount,
}: Props) {
  const [conversations, setConversations] = useState<AdminConversation[]>(initialConversations);
  const [msgCount, setMsgCount] = useState(initialMessageCount);

  const load = useCallback(async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        apiAdmin.adminListConversations({ limit: 100 }),
        apiAdmin.adminMessageCount(),
      ]);
      setConversations(convRes.items);
      setMsgCount(msgRes.count);
    } catch {
      // keep last known values
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Chat monitoring"
        description={`${fmt(conversations.length)} conversations, ${fmt(msgCount)} messages.`}
      />
      {conversations.length === 0 ? (
        <EmptyState message="No conversations yet." />
      ) : (
        <ul className={LIST}>
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {c.buyer?.full_name || "Buyer"} and {c.seller?.full_name || "seller"}
                </span>
                {c.last_message ? <span className="block truncate text-xs text-muted">{c.last_message}</span> : null}
              </span>
              <span
                className="shrink-0 text-xs tabular-nums text-muted"
                title={c.last_message_at ? new Date(c.last_message_at).toLocaleString() : undefined}
              >
                {relativeTime(c.last_message_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
