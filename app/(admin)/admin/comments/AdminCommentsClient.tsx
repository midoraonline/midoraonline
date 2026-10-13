"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminComment } from "@/lib/api/admin";
import { BTN_TEXT, EmptyState, LIST, PageHeader, Section, StatusDot, UnderlineTabs, relativeTime, useTabParam } from "@/components/dashboard/ui";

type Props = {
  initialProductComments: AdminComment[];
  initialShopComments: AdminComment[];
};

export default function AdminCommentsClient({
  initialProductComments,
  initialShopComments,
}: Props) {
  const [productComments, setProductComments] = useState<AdminComment[]>(initialProductComments);
  const [shopComments, setShopComments] = useState<AdminComment[]>(initialShopComments);
  const [tab, setTab] = useTabParam(["all", "flagged"] as const, "all");
  const showFlagged = tab === "flagged";
  const setShowFlagged = (v: boolean) => setTab(v ? "flagged" : "all");

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin.listComments({ flagged: showFlagged ? true : undefined, limit: 100 });
      setProductComments(res.product_comments);
      setShopComments(res.shop_comments);
    } catch {
      setProductComments([]);
      setShopComments([]);
    }
  }, [showFlagged]);

  useEffect(() => { void load(); }, [load]);

  const handleToggleFlag = async (id: string, table: "product_comments" | "shop_comments") => {
    try {
      await apiAdmin.toggleCommentFlag(id, table);
      load();
    } catch {}
  };

  const renderComment = (c: AdminComment, table: "product_comments" | "shop_comments") => (
    <li key={c.id} className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{c.comment}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {[c.user?.full_name || "Unknown", c.product?.title, c.shop?.name].filter(Boolean).join(" · ")}
          <span className="tabular-nums" title={new Date(c.created_at).toLocaleString()}>
            {" · "}
            {relativeTime(c.created_at)}
          </span>
        </p>
      </div>
      {c.is_flagged ? <StatusDot tone="bad">Flagged</StatusDot> : null}
      <button type="button" onClick={() => handleToggleFlag(c.id, table)} className={BTN_TEXT}>
        {c.is_flagged ? "Unflag" : "Flag"}
      </button>
    </li>
  );

  const groups = [
    { title: "Listing comments", items: productComments, table: "product_comments" as const },
    { title: "Shop comments", items: shopComments, table: "shop_comments" as const },
  ];

  return (
    <div>
      <PageHeader title="Comments" description="Flag comments that break the rules. Flagged comments are hidden." />
      <UnderlineTabs
        tabs={[
          { value: "all", label: "All" },
          { value: "flagged", label: "Flagged" },
        ]}
        value={showFlagged ? "flagged" : "all"}
        onChange={(v) => setShowFlagged(v === "flagged")}
      />
      {groups.map((g) => (
        <Section key={g.table} title={`${g.title} ${g.items.length}`}>
          {g.items.length === 0 ? (
            <EmptyState message="No comments here." />
          ) : (
            <ul className={LIST}>{g.items.map((c) => renderComment(c, g.table))}</ul>
          )}
        </Section>
      ))}
    </div>
  );
}
