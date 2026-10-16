"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminNearDupe, AdminReport, AdminSellerReport } from "@/lib/api/admin";
import ListingTypeTag from "@/components/ListingTypeTag";
import { listingTypeTagKind } from "@/lib/listingType";
import { productPageSlug } from "@/lib/productUrl";
import { BadgeCheck, ExternalLink, Eye } from "lucide-react";
import {
  BTN_SECONDARY,
  RowThumb,
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

  const reporterLine = (rep: AdminReport["reporter"], iso: string) => (
    <p className="mt-1 text-xs text-muted">
      Reported by {rep?.full_name || rep?.email || "a user"} · {date(iso)}
    </p>
  );

  const ugx = (n?: number | null) => (n == null ? null : `UGX ${Number(n).toLocaleString()}`);

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
            {reports.map((r) => {
              const l = r.listing;
              const kind = listingTypeTagKind(l?.item_type);
              return (
                <li key={r.id} className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start ${r.resolved ? "opacity-60" : ""}`}>
                  <div className="flex min-w-0 flex-1 gap-3">
                    <RowThumb src={l?.thumbnail_url} label={l?.title ?? r.product?.title} tone={kind} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                          {l?.title || r.product?.title || "Deleted listing"}
                        </p>
                        {l ? <ListingTypeTag kind={kind} /> : null}
                        {l?.status ? <StatusDot tone={l.status === "active" ? "ok" : "neutral"}>{l.status}</StatusDot> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {[l?.discount_price ? ugx(l.discount_price) : ugx(l?.price_ugx), l?.seller_name && `Seller: ${l.seller_name}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">{r.reason}</p>
                      {r.description ? <p className="mt-0.5 text-sm text-muted">{r.description}</p> : null}
                      {reporterLine(r.reporter, r.created_at)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <a href={`/admin/listings/${l?.id ?? r.product_id}`} className={BTN_SECONDARY}>
                      <Eye className="size-4" aria-hidden />
                      Admin view
                    </a>
                    {l?.title && l.status === "active" ? (
                      <a
                        href={`/products/${productPageSlug({ id: l.id, title: l.title })}`}
                        target="_blank"
                        rel="noreferrer"
                        className={BTN_SECONDARY}
                      >
                        <ExternalLink className="size-4" aria-hidden />
                        Public page
                      </a>
                    ) : null}
                    {r.resolved ? (
                      <StatusDot tone="neutral">Resolved</StatusDot>
                    ) : (
                      <button type="button" onClick={() => void handleResolveListing(r.id)} className={BTN_SECONDARY}>
                        Resolve
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {tab === "sellers" ? (
        sellerReports.length === 0 ? (
          <EmptyState message="No open seller reports." />
        ) : (
          <ul className={LIST}>
            {sellerReports.map((r) => {
              const sel = r.seller;
              return (
                <li key={r.id} className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start ${r.resolved ? "opacity-60" : ""}`}>
                  <div className="flex min-w-0 flex-1 gap-3">
                    <RowThumb src={sel?.logo_url} label={sel?.name} round />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                          {sel?.name || `Seller ${r.seller_id.slice(0, 8)}`}
                        </p>
                        {sel?.verified ? (
                          <StatusDot tone="ok">
                            <BadgeCheck className="size-3" aria-hidden /> Verified
                          </StatusDot>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {[
                          sel?.owner_name && sel.owner_name !== sel.name ? `Owner: ${sel.owner_name}` : null,
                          sel ? `${sel.listing_count} ${sel.listing_count === 1 ? "ad" : "ads"}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">{r.reason}</p>
                      {r.description ? <p className="mt-0.5 text-sm text-muted">{r.description}</p> : null}
                      {reporterLine(r.reporter, r.created_at)}
                      {sel ? <SellerDetails seller={sel} /> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    {sel?.slug ? (
                      <a href={`/shops/${sel.slug}`} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
                        <ExternalLink className="size-4" aria-hidden />
                        View business
                      </a>
                    ) : null}
                    {r.resolved ? (
                      <StatusDot tone="neutral">Resolved</StatusDot>
                    ) : (
                      <button type="button" onClick={() => void handleResolveSeller(r.id)} className={BTN_SECONDARY}>
                        Resolve
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
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

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 text-xs">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value}</dd>
    </div>
  );
}

function SellerDetails({ seller }: { seller: NonNullable<AdminSellerReport["seller"]> }) {
  const o = seller.owner;
  const verified = (v?: boolean | null) => (v ? " (verified)" : v === false ? " (not verified)" : "");
  return (
    <details className="mt-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-foreground">Seller &amp; business details</summary>
      <div className="mt-2 space-y-3">
        <dl className="space-y-1">
          <DetailRow label="Owner" value={seller.owner_name} />
          <DetailRow label="Email" value={o?.email ? `${o.email}${verified(o.email_verified)}` : null} />
          <DetailRow label="Phone" value={o?.phone_number ? `${o.phone_number}${verified(o.phone_verified)}` : null} />
          <DetailRow label="Account" value={[o?.role, o?.status].filter(Boolean).join(" · ")} />
          <DetailRow label="Joined" value={fmtDate(o?.joined_at)} />
          <DetailRow label="Seller ID" value={<span className="font-mono">{seller.id}</span>} />
        </dl>
        {(seller.businesses ?? []).map((b) => (
          <dl key={b.id} className="space-y-1 border-t border-border pt-2">
            <DetailRow label="Business" value={<span className="font-medium">{b.name}</span>} />
            <DetailRow label="Status" value={b.is_active ? "Active" : "Inactive"} />
            <DetailRow label="Location" value={b.location} />
            <DetailRow label="WhatsApp" value={b.whatsapp} />
            <DetailRow label="Email" value={b.email} />
            <DetailRow label="Badges" value={(b.trust_badges ?? []).join(", ").replace(/_/g, " ")} />
            <DetailRow label="Ads" value={b.listing_count} />
            <DetailRow label="Created" value={fmtDate(b.created_at)} />
            <DetailRow label="About" value={b.description} />
          </dl>
        ))}
      </div>
    </details>
  );
}
