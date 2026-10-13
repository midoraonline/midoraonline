"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminNearDupe, AdminReport, AdminSellerReport } from "@/lib/api/admin";
import {
  BTN_SECONDARY,
  EmptyState,
  LIST,
  PageHeader,
  StatusDot,
  UnderlineTabs,
  relativeTime,
  useTabParam,
} from "@/components/dashboard/ui";

const TAB_KEYS = ["listings", "sellers", "manual_review", "near_dupes"] as const;
type Tab = (typeof TAB_KEYS)[number];

type Props = { initialReports: AdminReport[] };

export default function AdminReportsClient({ initialReports }: Props) {
  const [tab, setTab] = useTabParam(TAB_KEYS, "listings");
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

  const date = (iso: string) => (
    <span className="tabular-nums" title={new Date(iso).toLocaleString()}>
      {relativeTime(iso)}
    </span>
  );

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Buyer reports, plus listings waiting on an admin after auto-moderation."
      />
      <UnderlineTabs
        tabs={tabs.map((t) => ({ value: t.id, label: `${t.label} ${t.count}` }))}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === "listings" ? (
        reports.length === 0 ? (
          <EmptyState message="No open listing reports." />
        ) : (
          <ul className={LIST}>
            {reports.map((r) => (
              <li key={r.id} className={`flex items-start gap-3 px-4 py-3 ${r.resolved ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.reason}</p>
                  {r.description ? <p className="mt-0.5 text-sm text-muted">{r.description}</p> : null}
                  <p className="mt-1 truncate text-xs text-muted">
                    {[r.product?.title, r.reporter?.full_name && `by ${r.reporter.full_name}`].filter(Boolean).join(" · ")}
                    {" · "}
                    {date(r.created_at)}
                  </p>
                </div>
                {r.resolved ? (
                  <StatusDot tone="neutral">Resolved</StatusDot>
                ) : (
                  <button type="button" onClick={() => void handleResolveListing(r.id)} className={BTN_SECONDARY}>
                    Resolve
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "sellers" ? (
        sellerReports.length === 0 ? (
          <EmptyState message="No open seller reports." />
        ) : (
          <ul className={LIST}>
            {sellerReports.map((r) => (
              <li key={r.id} className={`flex items-start gap-3 px-4 py-3 ${r.resolved ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.reason}</p>
                  {r.description ? <p className="mt-0.5 text-sm text-muted">{r.description}</p> : null}
                  <p className="mt-1 truncate text-xs text-muted">
                    Seller {r.seller_id.slice(0, 8)} · {date(r.created_at)}
                  </p>
                </div>
                {r.resolved ? (
                  <StatusDot tone="neutral">Resolved</StatusDot>
                ) : (
                  <button type="button" onClick={() => void handleResolveSeller(r.id)} className={BTN_SECONDARY}>
                    Resolve
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "manual_review" || tab === "near_dupes" ? (
        (tab === "manual_review" ? manualReview : nearDupes).length === 0 ? (
          <EmptyState
            message={tab === "manual_review" ? "No listings waiting for manual review." : "No near-duplicates waiting for review."}
          />
        ) : (
          <ul className={LIST}>
            {(tab === "manual_review" ? manualReview : nearDupes).map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.title}</p>
                  {r.reason ? <p className="mt-0.5 text-sm text-muted">{r.reason}</p> : null}
                  <p className="mt-1 text-xs text-muted">{date(r.created_at)}</p>
                </div>
                {r.product_id ? (
                  <a href={`/admin/listings?q=${encodeURIComponent(r.product_id)}`} className={BTN_SECONDARY}>
                    Open listing
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
