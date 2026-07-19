"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminConversation } from "@/lib/api/admin";
import { MaterialSymbol } from "@/components/MaterialSymbol";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chat Monitoring</h1>
        <p className="mt-1 text-sm text-muted">Overview of all buyer-seller conversations.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="dm-card p-4">
          <p className="text-2xl font-semibold">{conversations.length}</p>
          <p className="text-xs text-muted">Total Conversations</p>
        </div>
        <div className="dm-card p-4">
          <p className="text-2xl font-semibold">{msgCount}</p>
          <p className="text-xs text-muted">Total Messages</p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">No conversations yet.</div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <div key={c.id} className="dm-card p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {c.buyer?.full_name || "Unknown"} ↔ {c.seller?.full_name || "Unknown"}
                  </p>
                  {c.last_message && (
                    <p className="mt-0.5 truncate text-xs text-muted">{c.last_message}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted">
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
