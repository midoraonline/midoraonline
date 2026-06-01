"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminComment } from "@/lib/api/admin";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function AdminCommentsPage() {
  const [productComments, setProductComments] = useState<AdminComment[]>([]);
  const [shopComments, setShopComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagged, setShowFlagged] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAdmin.listComments({ flagged: showFlagged ? true : undefined, limit: 100 });
      setProductComments(res.product_comments);
      setShopComments(res.shop_comments);
    } catch {
      setProductComments([]);
      setShopComments([]);
    } finally {
      setLoading(false);
    }
  }, [showFlagged]);

  useEffect(() => { load(); }, [load]);

  const handleToggleFlag = async (id: string, table: "product_comments" | "shop_comments") => {
    try {
      await apiAdmin.toggleCommentFlag(id, table);
      load();
    } catch {}
  };

  const renderComment = (c: AdminComment, table: "product_comments" | "shop_comments") => (
    <div key={c.id} className={`dm-card flex items-start gap-3 p-3 ${c.is_flagged ? "ring-1 ring-red-500/30" : ""}`}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {c.is_flagged && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">Flagged</span>
          )}
          <span className="text-[10px] text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-sm">{c.comment}</p>
        <div className="flex gap-3 text-[10px] text-muted">
          <span>By: {c.user?.full_name || "Unknown"}</span>
          {c.product?.title && <span>On: {c.product.title}</span>}
          {c.shop?.name && <span>Shop: {c.shop.name}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleToggleFlag(c.id, table)}
        className={`dm-focus shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
          c.is_flagged
            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
            : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
        }`}
      >
        {c.is_flagged ? "Unflag" : "Flag"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments Moderation</h1>
          <p className="mt-1 text-sm text-muted">Review and flag comments on products and shops.</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showFlagged} onChange={(e) => setShowFlagged(e.target.checked)} className="rounded" />
        Show only flagged
      </label>

      {loading ? (
        <p className="text-sm text-muted">Loading comments...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Product Comments ({productComments.length})</h2>
            {productComments.length === 0 ? (
              <p className="text-sm text-muted">No comments.</p>
            ) : (
              <div className="space-y-2">{productComments.map((c) => renderComment(c, "product_comments"))}</div>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Shop Comments ({shopComments.length})</h2>
            {shopComments.length === 0 ? (
              <p className="text-sm text-muted">No comments.</p>
            ) : (
              <div className="space-y-2">{shopComments.map((c) => renderComment(c, "shop_comments"))}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
