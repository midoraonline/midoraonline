"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminFeedback } from "@/lib/api/admin";

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAdmin.listFeedback(100);
      setFeedbackList(res.items);
    } catch {
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Feedback</h1>
          <p className="mt-1 text-sm text-muted">Review feedback submitted by users.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading feedback...</p>
      ) : feedbackList.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">No feedback found.</div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((f) => (
            <div key={f.id} className="dm-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted font-medium">
                    {f.users?.full_name || f.users?.email || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted/60">
                    {new Date(f.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-surface-subtle rounded-xl border border-border">
                  <p className="text-sm font-medium whitespace-pre-wrap">{f.feedback_text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
