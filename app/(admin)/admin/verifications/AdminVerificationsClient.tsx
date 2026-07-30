"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import type {
  AdminVerification,
  AdminVerificationDoc,
  VerificationStatus,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/base";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type TabKey = "all" | "pending" | "verified" | "rejected" | "unverified";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "unverified", label: "Not submitted" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<VerificationStatus, string> = {
  unverified: "bg-foreground/[0.06] text-foreground/70",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const BADGE_LABELS: Record<string, string> = {
  shop_listed: "Shop listed",
  identity_verified: "Identity",
  business_verified: "Business",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id_front: "National ID (front)",
  national_id_back: "National ID (back)",
  selfie: "Selfie / profile photo",
  business_cert: "Business certificate",
  shop_photo: "Shop photo",
  business_reg: "Business registration",
  tax_doc: "Tax document",
};

type StageStatus = VerificationStatus | string;

type ParsedSubmission = {
  badges: string[];
  stage2Status: StageStatus;
  stage3Status: StageStatus;
  stage2Notes: string | null;
  stage3Notes: string | null;
  stage2Docs: AdminVerificationDoc[];
  stage3Docs: AdminVerificationDoc[];
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  pendingStage: 2 | 3 | null;
  appliedFor: string[];
};

function asStatus(value: unknown): StageStatus {
  if (typeof value === "string" && value) return value;
  return "unverified";
}

function asDocs(value: unknown): AdminVerificationDoc[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): AdminVerificationDoc | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      const doc: AdminVerificationDoc = { url };
      if (typeof row.type === "string") doc.type = row.type;
      if (typeof row.label === "string") doc.label = row.label;
      return doc;
    })
    .filter((d): d is AdminVerificationDoc => d !== null);
}

function parseSubmission(v: AdminVerification): ParsedSubmission {
  const meta =
    v.metadata && typeof v.metadata === "object"
      ? (v.metadata as Record<string, unknown>)
      : {};

  const stage2Status = asStatus(v.stage2_status ?? meta.stage2_status);
  const stage3Status = asStatus(v.stage3_status ?? meta.stage3_status);

  const badgesRaw = Array.isArray(v.badges)
    ? v.badges
    : Array.isArray(meta.badges)
      ? meta.badges
      : [];
  const badges = badgesRaw.filter((b): b is string => typeof b === "string");

  const stage2Docs = asDocs(meta.stage2_docs);
  const stage3Docs = asDocs(meta.stage3_docs);
  const fallbackDocs = asDocs(v.submitted_docs);
  // Older rows may only have top-level submitted_docs
  const docs2 = stage2Docs.length > 0 ? stage2Docs : stage3Status === "unverified" ? fallbackDocs : stage2Docs;
  const docs3 = stage3Docs.length > 0 ? stage3Docs : stage3Status !== "unverified" ? fallbackDocs : [];

  const phone =
    (typeof v.submitted_phone === "string" && v.submitted_phone) ||
    (typeof meta.stage2_phone === "string" && meta.stage2_phone) ||
    null;
  const whatsapp =
    (typeof v.submitted_whatsapp === "string" && v.submitted_whatsapp) ||
    (typeof meta.stage2_whatsapp === "string" && meta.stage2_whatsapp) ||
    null;
  const location =
    (typeof v.submitted_location === "string" && v.submitted_location) ||
    (typeof meta.stage2_location === "string" && meta.stage2_location) ||
    null;

  const stage2Notes =
    (typeof meta.stage2_notes === "string" && meta.stage2_notes.trim()) || null;
  const stage3Notes =
    (typeof meta.stage3_notes === "string" && meta.stage3_notes.trim()) || null;

  let pendingStage: 2 | 3 | null = null;
  if (stage3Status === "pending") pendingStage = 3;
  else if (stage2Status === "pending") pendingStage = 2;
  else if (v.status === "pending") {
    // Legacy pending without stage flags — treat as identity
    pendingStage = 2;
  }

  const appliedFor: string[] = [];
  if (stage2Status !== "unverified") appliedFor.push("Stage 2 · Identity");
  if (stage3Status !== "unverified") appliedFor.push("Stage 3 · Business");

  return {
    badges: badges.length ? badges : ["shop_listed"],
    stage2Status,
    stage3Status,
    stage2Notes,
    stage3Notes,
    stage2Docs: docs2,
    stage3Docs: docs3,
    phone,
    whatsapp,
    location,
    pendingStage,
    appliedFor,
  };
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(url) || /utfs\.io|ufs\.sh/i.test(url);
}

type Props = { initialItems: AdminVerification[] };

export default function AdminVerificationsClient({ initialItems }: Props) {
  const [tab, setTab] = useState<TabKey>("pending");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminVerification[]>(initialItems);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyShopId, setBusyShopId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await apiAdmin.listVerifications({
        status: "all",
        limit: 500,
        includeUnverified: true,
      });
      setItems(res.items ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load verifications",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable(
    { table: "shop_verifications", channel: "admin-shop-verifications" },
    () => {
      void load();
    },
  );
  useRealtimeTable(
    { table: "shops", channel: "admin-verifications-shops" },
    () => {
      void load();
    },
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: items.length,
      pending: 0,
      unverified: 0,
      verified: 0,
      rejected: 0,
    };
    for (const v of items) {
      c[v.status] = (c[v.status] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((v) => {
      if (tab !== "all" && v.status !== tab) return false;
      if (!q) return true;
      const name = (v.shops?.name || "").toLowerCase();
      const slug = (v.shops?.slug || "").toLowerCase();
      const email = (v.shops?.shop_email || "").toLowerCase();
      const sub = parseSubmission(v);
      const hay = [
        name,
        slug,
        email,
        v.shop_id.toLowerCase(),
        sub.phone?.toLowerCase() ?? "",
        sub.whatsapp?.toLowerCase() ?? "",
        sub.location?.toLowerCase() ?? "",
      ].join(" ");
      return hay.includes(q);
    });
  }, [items, tab, query]);

  async function runAction(
    shopId: string,
    action: "approve" | "reject" | "queue",
    successMsg: string,
    stage?: 2 | 3,
  ) {
    setBusyShopId(shopId);
    try {
      const notes = noteDraft[shopId]?.trim() || undefined;
      if (action === "reject" && !notes) {
        toast.error("Please add a short reason before rejecting.");
        return;
      }
      if (action === "approve") {
        await apiAdmin.approveVerification(shopId, notes, { stage: stage ?? 2 });
      } else if (action === "reject") {
        await apiAdmin.rejectVerification(shopId, notes, { stage: stage ?? 2 });
      } else {
        await apiAdmin.queueVerification(shopId, notes);
      }
      setNoteDraft((s) => ({ ...s, [shopId]: "" }));
      toast.success(successMsg);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyShopId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Admin · Verifications
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Shop verification console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review merchant submissions — identity (stage 2) and business
            (stage 3) — with docs, contact details, and stage-aware decisions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, phone, or location…"
            className="min-w-[10rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm sm:flex-none"
          />
          <button
            onClick={() => load()}
            disabled={refreshing}
            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <nav className="-mx-1 flex flex-wrap gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              <span>{t.label}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/[0.08] text-foreground/70",
                ].join(" ")}
              >
                {counts[t.key] ?? 0}
              </span>
            </button>
          );
        })}
      </nav>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="dm-card p-8 text-sm text-muted">
          No shops match this filter.
        </div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {visible.map((v) => {
            const shopName = v.shops?.name || v.shop_id;
            const slug = v.shops?.slug || null;
            const isBusy = busyShopId === v.shop_id;
            const sub = parseSubmission(v);
            const isOpen = expanded[v.shop_id] ?? v.status === "pending";
            const canQueue = v.status === "unverified";
            const stageLabel =
              sub.pendingStage === 3
                ? "Stage 3 · Business"
                : sub.pendingStage === 2
                  ? "Stage 2 · Identity"
                  : null;

            return (
              <li
                key={v.id || v.shop_id}
                className="dm-card space-y-4 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold truncate">
                        {shopName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          STATUS_BADGE[v.status] || STATUS_BADGE.unverified
                        }`}
                      >
                        {v.status}
                      </span>
                      {stageLabel ? (
                        <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">
                          Applied: {stageLabel}
                        </span>
                      ) : null}
                      {v.shops?.is_active ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {slug ? `/${slug} · ` : ""}
                      <code className="font-mono">{v.shop_id.slice(0, 8)}…</code>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {v.shops?.shop_email ? `Contact: ${v.shops.shop_email}` : null}
                      {v.requested_at
                        ? ` · requested ${formatDate(v.requested_at)}`
                        : ""}
                      {v.reviewed_at
                        ? ` · reviewed ${formatDate(v.reviewed_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {slug ? (
                      <a
                        href={`/shops/${slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-foreground/[0.04]"
                      >
                        View ↗
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((s) => ({ ...s, [v.shop_id]: !isOpen }))
                      }
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-foreground/[0.04]"
                    >
                      {isOpen ? "Hide submission" : "Show submission"}
                    </button>
                  </div>
                </div>

                {/* Stage + badge summary — always visible */}
                <div className="flex flex-wrap gap-1.5">
                  {sub.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-semibold text-foreground/75"
                    >
                      {BADGE_LABELS[b] ?? b}
                    </span>
                  ))}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      STATUS_BADGE[(sub.stage2Status as VerificationStatus)] ||
                      STATUS_BADGE.unverified
                    }`}
                  >
                    Identity: {sub.stage2Status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      STATUS_BADGE[(sub.stage3Status as VerificationStatus)] ||
                      STATUS_BADGE.unverified
                    }`}
                  >
                    Business: {sub.stage3Status}
                  </span>
                </div>

                {isOpen ? (
                  <div className="space-y-4 rounded-xl border border-border bg-foreground/[0.02] p-4">
                    {sub.appliedFor.length > 0 ? (
                      <p className="text-xs text-muted">
                        Merchant applied for:{" "}
                        <span className="font-semibold text-foreground">
                          {sub.appliedFor.join(" · ")}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted">
                        No verification application submitted yet.
                      </p>
                    )}

                    {(sub.phone || sub.whatsapp || sub.location) && (
                      <section className="space-y-2">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                          Submitted contact (Identity)
                        </h4>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                          {sub.phone ? (
                            <div>
                              <dt className="text-[11px] text-muted">Phone</dt>
                              <dd>
                                <a
                                  href={`tel:${sub.phone}`}
                                  className="font-medium text-foreground underline-offset-2 hover:underline"
                                >
                                  {sub.phone}
                                </a>
                              </dd>
                            </div>
                          ) : null}
                          {sub.whatsapp ? (
                            <div>
                              <dt className="text-[11px] text-muted">WhatsApp</dt>
                              <dd>
                                <a
                                  href={`https://wa.me/${sub.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-foreground underline-offset-2 hover:underline"
                                >
                                  {sub.whatsapp}
                                </a>
                              </dd>
                            </div>
                          ) : null}
                          {sub.location ? (
                            <div className="sm:col-span-2">
                              <dt className="text-[11px] text-muted">Location</dt>
                              <dd className="font-medium text-foreground">
                                {sub.location}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </section>
                    )}

                    <StageDocsBlock
                      title="Stage 2 · Identity documents"
                      status={sub.stage2Status}
                      notes={sub.stage2Notes}
                      docs={sub.stage2Docs}
                    />
                    <StageDocsBlock
                      title="Stage 3 · Business documents"
                      status={sub.stage3Status}
                      notes={sub.stage3Notes}
                      docs={sub.stage3Docs}
                    />

                    {v.notes &&
                    v.notes !== sub.stage2Notes &&
                    v.notes !== sub.stage3Notes ? (
                      <p className="rounded-lg border border-border bg-background p-3 text-xs text-muted">
                        <strong className="font-semibold text-foreground/80">
                          Latest notes:
                        </strong>{" "}
                        {v.notes}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Admin notes{" "}
                    <span className="font-normal normal-case text-muted/70">
                      (required to reject)
                    </span>
                  </span>
                  <textarea
                    value={noteDraft[v.shop_id] ?? ""}
                    onChange={(e) =>
                      setNoteDraft((s) => ({
                        ...s,
                        [v.shop_id]: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background p-2 text-sm"
                    placeholder="Share context with the merchant…"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {sub.pendingStage ? (
                    <>
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          runAction(
                            v.shop_id,
                            "approve",
                            `${shopName}: ${stageLabel} approved.`,
                            sub.pendingStage!,
                          )
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isBusy
                          ? "Working…"
                          : `Approve ${sub.pendingStage === 3 ? "Business" : "Identity"}`}
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          runAction(
                            v.shop_id,
                            "reject",
                            `${shopName}: ${stageLabel} rejected.`,
                            sub.pendingStage!,
                          )
                        }
                        className="rounded-xl border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-300"
                      >
                        Reject {sub.pendingStage === 3 ? "Business" : "Identity"}
                      </button>
                    </>
                  ) : (
                    <>
                      {sub.stage2Status !== "verified" ? (
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            runAction(
                              v.shop_id,
                              "approve",
                              `${shopName}: Identity approved.`,
                              2,
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isBusy ? "Working…" : "Approve Identity"}
                        </button>
                      ) : null}
                      {sub.stage2Status === "verified" &&
                      sub.stage3Status !== "verified" ? (
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            runAction(
                              v.shop_id,
                              "approve",
                              `${shopName}: Business approved.`,
                              3,
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isBusy ? "Working…" : "Approve Business"}
                        </button>
                      ) : null}
                      <button
                        disabled={isBusy || v.status === "rejected"}
                        onClick={() =>
                          runAction(
                            v.shop_id,
                            "reject",
                            `${shopName} has been rejected.`,
                            sub.stage3Status === "pending" ||
                              sub.stage3Status === "verified"
                              ? 3
                              : 2,
                          )
                        }
                        className="rounded-xl border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-300"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {canQueue ? (
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          v.shop_id,
                          "queue",
                          `${shopName} queued for review.`,
                        )
                      }
                      className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-50"
                    >
                      Queue for review
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StageDocsBlock({
  title,
  status,
  notes,
  docs,
}: {
  title: string;
  status: StageStatus;
  notes: string | null;
  docs: AdminVerificationDoc[];
}) {
  if (status === "unverified" && docs.length === 0 && !notes) return null;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h4>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            STATUS_BADGE[status as VerificationStatus] || STATUS_BADGE.unverified
          }`}
        >
          {status}
        </span>
      </div>
      {notes ? (
        <p className="rounded-lg border border-border bg-background p-2.5 text-xs text-foreground/80">
          <span className="font-semibold">Merchant note:</span> {notes}
        </p>
      ) : null}
      {docs.length === 0 ? (
        <p className="text-xs text-muted">No documents attached for this stage.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {docs.map((doc, idx) => {
            const label =
              doc.label ||
              (doc.type ? DOC_TYPE_LABELS[doc.type] : null) ||
              doc.type ||
              `Document ${idx + 1}`;
            return (
              <li
                key={`${doc.url}-${idx}`}
                className="overflow-hidden rounded-xl border border-border bg-background"
              >
                {isImageUrl(doc.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin review of uploaded URLs
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    <img
                      src={doc.url}
                      alt={label}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="flex h-24 items-center justify-center bg-foreground/[0.04] text-xs text-muted">
                    File attachment
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    {label}
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Open
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
