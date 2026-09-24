"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminNearDupe, AdminReport, AdminSellerReport } from "@/lib/api/admin";

type Tab = "listings" | "sellers" | "manual_review" | "near_dupes";

type Props = { initialReports: AdminReport[] };

export default function AdminReportsClient({ initialReports }: Props) {
  const [tab, setTab] = useState<Tab>("listings");
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [sellerReports, setSellerReports] = useState<AdminSellerReport[]>([]);
  const [nearDupes, setNearDupes] = useState<AdminNearDupe[]>([]);
  const [manualReview, setManualReview] = useState<AdminNearDupe[]>([]);
  const [counts, setCounts] = useState({
    product_reports: initialReports.length,
    seller_reports: 0,
    near_dupes: 0,
    manual_review: 0,
  });

  const load = useCallback(async () => {
    try {
      const queue = await apiAdmin.listTrustQueue({ limit: 100 });
      setReports(queue.product_reports ?? []);
      setSellerReports(queue.seller_reports ?? []);
      setNearDupes(queue.near_dupes ?? []);
      setManualReview(queue.manual_review ?? []);
      setCounts({
        product_reports: queue.counts?.product_reports ?? 0,
        seller_reports: queue.counts?.seller_reports ?? 0,
        near_dupes: queue.counts?.near_dupes ?? 0,
        manual_review: queue.counts?.manual_review ?? 0,
      });
    } catch {
      try {
        const [listings, sellers, dupes] = await Promise.all([
          apiAdmin.listReports({ resolved: false, limit: 100 }),
          apiAdmin.listSellerReports({ resolved: false, limit: 100 }),
          apiAdmin.listNearDuplicates({ limit: 100 }),
        ]);
        setReports(listings.items);
        setSellerReports(sellers.items);
        setNearDupes(dupes.items);
        setManualReview(dupes.items);
        setCounts({
          product_reports: listings.items.length,
          seller_reports: sellers.items.length,
          near_dupes: dupes.items.length,
          manual_review: dupes.items.length,
        });
      } catch {
        /* keep last */
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResolveListing = async (id: string) => {
    try {
      await apiAdmin.resolveReport(id);
      void load();
    } catch {}
  };

  const handleResolveSeller = async (id: string) => {
    try {
      await apiAdmin.resolveSellerReport(id);
      void load();
    } catch {}
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "listings", label: "Listing reports", count: counts.product_reports },
    { id: "sellers", label: "Seller reports", count: counts.seller_reports },
    { id: "manual_review", label: "In review", count: counts.manual_review },
    { id: "near_dupes", label: "Near-duplicates", count: counts.near_dupes },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Trust queue — reports plus listings awaiting admin after auto-moderation timeout or soft flags.
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-accent text-white" : "bg-foreground/[0.06] text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="ml-1.5 opacity-80">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        reports.length === 0 ? (
          <div className="dm-card p-8 text-center text-sm text-muted">No open listing reports.</div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className={`dm-card flex items-start gap-4 p-4 ${r.resolved ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.resolved ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    }`}>
                      {r.resolved ? "Resolved" : "Open"}
                    </span>
                    <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{r.reason}</p>
                  {r.description ? <p className="text-xs text-muted">{r.description}</p> : null}
                  <div className="flex gap-3 text-[10px] text-muted">
                    {r.product?.title ? <span>Product: {r.product.title}</span> : null}
                    {r.reporter?.full_name ? <span>By: {r.reporter.full_name}</span> : null}
                  </div>
                </div>
                {!r.resolved ? (
                  <button
                    type="button"
                    onClick={() => void handleResolveListing(r.id)}
                    className="dm-focus shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "sellers" ? (
        sellerReports.length === 0 ? (
          <div className="dm-card p-8 text-center text-sm text-muted">No open seller reports.</div>
        ) : (
          <div className="space-y-2">
            {sellerReports.map((r) => (
              <div key={r.id} className={`dm-card flex items-start gap-4 p-4 ${r.resolved ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Seller
                    </span>
                    <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{r.reason}</p>
                  {r.description ? <p className="text-xs text-muted">{r.description}</p> : null}
                  <p className="text-[10px] text-muted">Seller id: {r.seller_id}</p>
                </div>
                {!r.resolved ? (
                  <button
                    type="button"
                    onClick={() => void handleResolveSeller(r.id)}
                    className="dm-focus shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "manual_review" ? (
        manualReview.length === 0 ? (
          <div className="dm-card p-8 text-center text-sm text-muted">
            No listings awaiting manual review.
          </div>
        ) : (
          <div className="space-y-2">
            {manualReview.map((r) => (
              <div key={r.id} className="dm-card flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      In review
                    </span>
                    <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.reason ? <p className="text-xs text-muted">{r.reason}</p> : null}
                  {r.product_id ? (
                    <p className="text-[10px] text-muted">Product: {r.product_id}</p>
                  ) : null}
                </div>
                {r.product_id ? (
                  <a
                    href={`/admin/listings?q=${encodeURIComponent(r.product_id)}`}
                    className="dm-focus shrink-0 rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/[0.1]"
                  >
                    Review listing
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "near_dupes" ? (
        nearDupes.length === 0 ? (
          <div className="dm-card p-8 text-center text-sm text-muted">
            No near-duplicates in needs_review. Apply migration 040 and re-moderate to populate.
          </div>
        ) : (
          <div className="space-y-2">
            {nearDupes.map((r) => (
              <div key={r.id} className="dm-card flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      Near-dupe
                    </span>
                    <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.reason ? <p className="text-xs text-muted">{r.reason}</p> : null}
                  {r.product_id ? (
                    <p className="text-[10px] text-muted">Product: {r.product_id}</p>
                  ) : null}
                </div>
                {r.product_id ? (
                  <a
                    href={`/admin/listings?q=${encodeURIComponent(r.product_id)}`}
                    className="dm-focus shrink-0 rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/[0.1]"
                  >
                    Open listing
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
