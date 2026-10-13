"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminFeedback } from "@/lib/api/admin";
import { EmptyState, LIST, PageHeader, formatCount as fmt, relativeTime } from "@/components/dashboard/ui";

type Props = { initialItems: AdminFeedback[] };

export default function AdminFeedbackClient({ initialItems }: Props) {
  const [feedbackList, setFeedbackList] = useState<AdminFeedback[]>(initialItems);

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin.listFeedback(100);
      setFeedbackList(res.items);
    } catch {
      // keep last known value
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <PageHeader title="Feedback" description={`${fmt(feedbackList.length)} messages from users, newest first.`} />
      {feedbackList.length === 0 ? (
        <EmptyState message="No feedback yet." />
      ) : (
        <ul className={LIST}>
          {feedbackList.map((f) => (
            <li key={f.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{f.users?.full_name || f.users?.email || "Anonymous"}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted" title={new Date(f.created_at).toLocaleString()}>
                  {relativeTime(f.created_at)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{f.feedback_text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
