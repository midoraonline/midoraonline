"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminListingProduct } from "@/lib/api/admin";
import { MaterialSymbol } from "@/components/MaterialSymbol";

const FILTERS = ["pending_review", "active", "rejected", "all"] as const;
const FILTER_LABELS: Record<string, string> = {
  pending_review: "Pending",
  active: "Active",
  rejected: "Rejected",
  all: "All",
};
const STATUS_COLORS: Record<string, string> = {
  pending_review:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

type ListingFilter = "pending_review" | "active" | "rejected" | "all";

type Props = {
  initialItems: AdminListingProduct[];
  initialTotalPages: number;
};

export default function AdminListingsClient({ initialItems, initialTotalPages }: Props) {
  const [listings, setListings] = useState<AdminListingProduct[]>(initialItems);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingFilter>("pending_review");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const PER_PAGE = 20;

  const load = useCallback(async () => {
    try {
      const qs: { limit?: number; status?: string; page?: number } = { limit: PER_PAGE, page };
      if (filter !== "all") qs.status = filter;
      const res = await apiAdmin.listAdminListings(qs);
      setListings(res.items);
      setTotalPages(res.total_pages);
    } catch {
      setListings([]);
    }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load]);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    setReviewing(id);
    try {
      await apiAdmin.reviewListing(id, action, notesMap[id] || undefined);
      setNotesMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setRejectConfirm(null);
      load();
    } catch {}
    setReviewing(null);
  };

  const pages: number[] = [];
  if (totalPages > 1) {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listings Review</h1>
          <p className="mt-1 text-sm text-muted">Review, approve, or reject all product listings across the platform.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setPage(1); }}
            className={`dm-pill dm-focus px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "border border-foreground/[0.08] text-foreground/60 hover:bg-foreground/[0.04]"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted">
          <MaterialSymbol name="inventory_2" className="!text-3xl" />
          <p className="text-sm">No listings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl border border-foreground/[0.08] bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                {listing.image_urls?.[0] && (
                  <img
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{listing.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        STATUS_COLORS[listing.status] ?? "bg-foreground/[0.06] text-foreground/50"
                      }`}
                    >
                      {listing.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted">{listing.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                    <span>UGX {listing.price_ugx.toLocaleString()}</span>
                    <span>Shop: {listing.shop_name ?? listing.shop_id}</span>
                    {listing.category && <span>Category: {listing.category}</span>}
                    <span>Views: {listing.view_count}</span>
                    <span>Reports: {listing.reports_count}</span>
                    <span>Created: {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>

                  {listing.review_notes && (
                    <div className="mt-1 flex items-start gap-1.5 text-[11px] text-muted">
                      <MaterialSymbol name="rate_review" className="!text-sm shrink-0 mt-0.5" />
                      <span>
                        Review note: &ldquo;{listing.review_notes}&rdquo;
                        {listing.reviewed_at && (
                          <> — {new Date(listing.reviewed_at).toLocaleDateString()}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {(listing.status === "pending_review" || filter === "all") && (
                  <div className="shrink-0 space-y-1.5">
                    {listing.status === "pending_review" && (
                      <>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReview(listing.id, "approve")}
                            disabled={reviewing === listing.id}
                            className="dm-focus flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:brightness-95 disabled:opacity-50"
                          >
                            <MaterialSymbol name="check" className="!text-sm" />
                            Approve
                          </button>

                          {rejectConfirm === listing.id ? (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReview(listing.id, "reject")}
                                disabled={reviewing === listing.id}
                                className="dm-focus flex items-center gap-1 rounded-lg bg-red-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:brightness-95 disabled:opacity-50"
                              >
                                Confirm reject
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectConfirm(null)}
                                className="dm-focus rounded-lg border border-foreground/[0.12] px-2 py-1.5 text-[11px] font-medium text-foreground/60"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRejectConfirm(listing.id)}
                              className="dm-focus flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:brightness-95"
                            >
                              <MaterialSymbol name="close" className="!text-sm" />
                              Reject
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Review notes..."
                          value={notesMap[listing.id] ?? ""}
                          onChange={(e) =>
                            setNotesMap((prev) => ({ ...prev, [listing.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-foreground/[0.08] bg-transparent px-2.5 py-1.5 text-[11px] outline-none placeholder:text-foreground/30 focus:border-accent"
                        />
                      </>
                    )}

                    {listing.status !== "pending_review" && (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1 rounded-lg bg-foreground/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-foreground/30"
                      >
                        Already {listing.status}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="dm-focus flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-3 py-1.5 text-xs font-medium text-foreground/60 disabled:opacity-30"
              >
                <MaterialSymbol name="chevron_left" className="!text-sm" />
                Prev
              </button>

              {pages[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    className="dm-focus flex size-8 items-center justify-center rounded-lg text-xs font-medium text-foreground/60 hover:bg-foreground/[0.04]"
                  >
                    1
                  </button>
                  {pages[0] > 2 && <span className="text-xs text-foreground/30">...</span>}
                </>
              )}

              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`dm-focus flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-accent text-white"
                      : "text-foreground/60 hover:bg-foreground/[0.04]"
                  }`}
                >
                  {p}
                </button>
              ))}

              {pages[pages.length - 1] < totalPages && (
                <>
                  {pages[pages.length - 1] < totalPages - 1 && (
                    <span className="text-xs text-foreground/30">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="dm-focus flex size-8 items-center justify-center rounded-lg text-xs font-medium text-foreground/60 hover:bg-foreground/[0.04]"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="dm-focus flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-3 py-1.5 text-xs font-medium text-foreground/60 disabled:opacity-30"
              >
                Next
                <MaterialSymbol name="chevron_right" className="!text-sm" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
