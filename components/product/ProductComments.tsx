"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Comment = {
  id: string;
  product_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  users?: { full_name?: string | null } | null;
};

type Props = {
  productId: string;
};

export default function ProductComments({ productId }: Props) {
  const session = useAppSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<Comment[]>(
        `/api/v1/products/${encodeURIComponent(productId)}/comments`,
      );
      setComments(Array.isArray(res) ? res : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !session.isAuthenticated) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/v1/products/${encodeURIComponent(productId)}/comments`, {
        method: "POST",
        body: { comment: text.trim() },
      });
      setText("");
      load();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="dm-focus inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
      >
        <MaterialSymbol name="chat" className="!text-sm" />
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </button>

      {expanded && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-muted">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted">No comments yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-foreground/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-foreground/70">
                      {c.users?.full_name || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/80">{c.comment}</p>
                </div>
              ))}
            </div>
          )}

          {session.isAuthenticated ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                className="dm-input dm-focus min-w-0 flex-1 text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="dm-pill dm-focus shrink-0 bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Post
              </button>
            </form>
          ) : (
            <p className="text-xs text-muted">Log in to leave a comment.</p>
          )}
        </div>
      )}
    </div>
  );
}
