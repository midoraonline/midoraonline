"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminListingProduct } from "@/lib/api/admin";
import {
  BTN_SECONDARY,
  BTN_TEXT,
  EmptyState,
  LIST,
  PageHeader,
  Pagination,
  StatusDot,
  UnderlineTabs,
  formatCount as fmt,
  relativeTime,
  useTabParam,
} from "@/components/dashboard/ui";

const FILTERS = ["pending_review", "active", "rejected", "all"] as const;
const FILTER_LABELS: Record<string, string> = {
  pending_review: "In review",
  active: "Active",
  rejected: "Rejected",
  all: "All",
};
type ListingFilter = "pending_review" | "active" | "rejected" | "all";

type Props = {
  initialItems: AdminListingProduct[];
  initialTotalPages: number;
};

export default function AdminListingsClient({ initialItems, initialTotalPages }: Props) {
  const [listings, setListings] = useState<AdminListingProduct[]>(initialItems);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [filter, setFilter] = useTabParam(FILTERS, "pending_review");
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

  const statusTone = (st: string) =>
    st === "active" ? "ok" : st === "pending_review" ? "warn" : st === "rejected" ? "bad" : "neutral";

  return (
    <div>
      <PageHeader title="Listings" description="Approve or reject listings across the platform." />
      <UnderlineTabs
        tabs={FILTERS.map((f) => ({ value: f, label: FILTER_LABELS[f] }))}
        value={filter}
        onChange={(f) => {
          setFilter(f as ListingFilter);
          setPage(1);
        }}
      />

      {listings.length === 0 ? (
        <EmptyState message="No listings here." />
      ) : (
        <>
          <ul className={LIST}>
            {listings.map((listing) => {
              const canApprove = listing.status !== "active";
              const canReject = listing.status !== "rejected";
              return (
                <li key={listing.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {listing.image_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.image_urls[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{listing.title}</p>
                        <StatusDot tone={statusTone(listing.status)}>
                          <span className="capitalize">{listing.status.replace(/_/g, " ")}</span>
                        </StatusDot>
                      </div>
                      <p className="mt-0.5 truncate text-xs tabular-nums text-muted">
                        UGX {fmt(listing.price_ugx)} · {listing.shop_name ?? listing.shop_id}
                        {listing.category ? ` · ${listing.category}` : ""} · {fmt(listing.view_count)} views
                        {listing.reports_count ? ` · ${fmt(listing.reports_count)} reports` : ""} ·{" "}
                        <span title={new Date(listing.created_at).toLocaleString()}>{relativeTime(listing.created_at)}</span>
                      </p>
                      {listing.review_notes ? (
                        <p className="mt-1 text-xs text-muted">Note: {listing.review_notes}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-56">
                    <div className="flex flex-wrap gap-2">
                      {canApprove ? (
                        <button
                          type="button"
                          onClick={() => handleReview(listing.id, "approve")}
                          disabled={reviewing === listing.id}
                          className={BTN_SECONDARY}
                        >
                          {listing.status === "rejected" ? "Re-approve" : "Approve"}
                        </button>
                      ) : null}
                      {canReject ? (
                        rejectConfirm === listing.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReview(listing.id, "reject")}
                              disabled={reviewing === listing.id}
                              className="inline-flex h-9 items-center rounded-md bg-rose-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                            >
                              Confirm reject
                            </button>
                            <button type="button" onClick={() => setRejectConfirm(null)} className={BTN_TEXT}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRejectConfirm(listing.id)}
                            className="text-sm font-medium text-rose-600 hover:underline"
                          >
                            Reject
                          </button>
                        )
                      ) : null}
                    </div>
                    <input
                      type="text"
                      placeholder="Review note (optional)"
                      aria-label="Review note"
                      value={notesMap[listing.id] ?? ""}
                      onChange={(e) => setNotesMap((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface shadow-xs px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
