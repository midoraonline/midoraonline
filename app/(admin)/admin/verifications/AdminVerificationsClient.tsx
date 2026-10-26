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
import { BTN_SECONDARY, EmptyState, ErrorState, PageHeader, StatusDot, UnderlineTabs, useTabParam, type StatusTone } from "@/components/dashboard/ui";

type TabKey = "all" | "pending" | "submitted" | "verified" | "rejected" | "unverified";

const TAB_KEYS = ["pending", "submitted", "unverified", "verified", "rejected", "all"] as const;

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Review queue" },
  { key: "submitted", label: "Captured (no review)" },
  { key: "unverified", label: "Not submitted" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_TONE: Record<VerificationStatus, StatusTone> = {
  unverified: "neutral",
  submitted: "neutral",
  pending: "warn",
  verified: "ok",
  rejected: "bad",
};

function VStatus({ status, prefix }: { status: string; prefix?: string }) {
  return (
    <StatusDot tone={STATUS_TONE[status as VerificationStatus] ?? "neutral"}>
      {prefix ? `${prefix}: ` : ""}
      <span className="capitalize">{status}</span>
    </StatusDot>
  );
}

const BADGE_LABELS: Record<string, string> = {
  shop_listed: "Shop listed",
  identity_verified: "Identity",
  business_verified: "Business",
  professional_verified: "Professional",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id_front: "National ID (front)",
  national_id_back: "National ID (back)",
  passport: "Passport",
  driving_permit: "Driving permit",
  selfie: "Selfie with ID",
  business_cert: "Business certificate",
  shop_photo: "Shop photo",
  business_reg: "Business registration",
  tin: "TIN",
  tax_doc: "Tax document",
  professional_cred: "Professional credential",
  professional_license: "Professional license",
};

type StageStatus = VerificationStatus | string;

type ParsedSubmission = {
  badges: string[];
  stage2Status: StageStatus;
  stage3Status: StageStatus;
  stage4Status: StageStatus;
  stage2Notes: string | null;
  stage3Notes: string | null;
  stage4Notes: string | null;
  stage2Docs: AdminVerificationDoc[];
  stage3Docs: AdminVerificationDoc[];
  stage4Docs: AdminVerificationDoc[];
  stage2Review: string | null;
  stage3Review: string | null;
  stage4Review: string | null;
  stage3Fields: Record<string, string>;
  stage4Fields: Record<string, string>;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  pendingStage: 2 | 3 | 4 | null;
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
  const stage4Status = asStatus(v.stage4_status ?? meta.stage4_status);

  const badgesRaw = Array.isArray(v.badges)
    ? v.badges
    : Array.isArray(meta.badges)
      ? meta.badges
      : [];
  const badges = badgesRaw.filter((b): b is string => typeof b === "string");

  const stage2Docs = asDocs(meta.stage2_docs);
  const stage3Docs = asDocs(meta.stage3_docs);
  const stage4Docs = asDocs(meta.stage4_docs);
  const fallbackDocs = asDocs(v.submitted_docs);
  const docs2 = stage2Docs.length > 0 ? stage2Docs : stage3Status === "unverified" ? fallbackDocs : stage2Docs;
  const docs3 = stage3Docs.length > 0 ? stage3Docs : stage3Status !== "unverified" ? fallbackDocs : [];
  const docs4 = stage4Docs;

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
  const stage4Notes =
    (typeof meta.stage4_notes === "string" && meta.stage4_notes.trim()) || null;

  const text = (k: string) => (typeof meta[k] === "string" && (meta[k] as string).trim()) || null;
  const rec = (k: string) =>
    meta[k] && typeof meta[k] === "object" ? (meta[k] as Record<string, string>) : {};
  let pendingStage: 2 | 3 | 4 | null = null;
  if (stage4Status === "pending") pendingStage = 4;
  else if (stage3Status === "pending") pendingStage = 3;
  else if (stage2Status === "pending") pendingStage = 2;
  else if (v.status === "pending") {
    pendingStage = 2;
  }

  const appliedFor: string[] = [];
  if (stage2Status !== "unverified") appliedFor.push("Stage 2 · Identity");
  if (stage3Status !== "unverified") appliedFor.push("Stage 3 · Business");
  if (stage4Status !== "unverified") appliedFor.push("Stage 4 · Professional");

  return {
    badges: badges.length ? badges : ["shop_listed"],
    stage2Status,
    stage3Status,
    stage4Status,
    stage2Notes,
    stage3Notes,
    stage4Notes,
    stage2Review: text("stage2_review_notes"),
    stage3Review: text("stage3_review_notes"),
    stage4Review: text("stage4_review_notes"),
    stage3Fields: rec("stage3_fields"),
    stage4Fields: rec("stage4_fields"),
    stage2Docs: docs2,
    stage3Docs: docs3,
    stage4Docs: docs4,
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
  const [tab, setTab] = useTabParam(TAB_KEYS, "pending");
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
      submitted: 0,
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
    stage?: 2 | 3 | 4,
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
    <div>
      <PageHeader
        title="Verifications"
        description="Identity, business and professional submissions from merchants."
        action={
          <button onClick={() => load()} disabled={refreshing} className={BTN_SECONDARY}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      <UnderlineTabs
        tabs={TABS.map((t) => ({ value: t.key, label: `${t.label} ${counts[t.key] ?? 0}` }))}
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search shop, phone or location"
        aria-label="Search verifications"
        className="mb-4 h-10 w-full max-w-xs rounded-lg border border-border bg-surface shadow-xs px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {visible.length === 0 ? (
        <EmptyState message="No shops match this filter." />
      ) : (
        <ul className="space-y-3">
          {visible.map((v) => {
            const shopName = v.shops?.name?.trim() || "Unnamed shop";
            const slug = v.shops?.slug || null;
            const isBusy = busyShopId === v.shop_id;
            const sub = parseSubmission(v);
            const isOpen = expanded[v.shop_id] ?? v.status === "pending";
            const canQueue = v.status === "unverified";
            const stageLabel =
              sub.pendingStage === 4
                ? "Stage 4 · Professional"
                : sub.pendingStage === 3
                  ? "Stage 3 · Business"
                  : sub.pendingStage === 2
                    ? "Stage 2 · Identity"
                    : null;
            const pendingName =
              sub.pendingStage === 4
                ? "Professional"
                : sub.pendingStage === 3
                  ? "Business"
                  : "Identity";

            return (
              <li
                key={v.id || v.shop_id}
                className="space-y-4 rounded-xl border border-border bg-surface shadow-xs p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {shopName}
                      </h3>
                      <VStatus status={v.status} />
                      {stageLabel ? (
                        <span className="text-xs text-muted">
                          Applied: {stageLabel}
                        </span>
                      ) : null}
                      {v.shops?.is_active ? (
                        <span className="text-xs text-muted">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted">
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
                        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-subtle"
                      >
                        View ↗
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((s) => ({ ...s, [v.shop_id]: !isOpen }))
                      }
                      className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-subtle"
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
                      className="text-xs text-foreground/80"
                    >
                      {BADGE_LABELS[b] ?? b}
                    </span>
                  ))}
                  <VStatus prefix="Identity" status={sub.stage2Status} />
                  <VStatus prefix="Business" status={sub.stage3Status} />
                  <VStatus prefix="Professional" status={sub.stage4Status} />
                </div>

                {isOpen ? (
                  <div className="space-y-4 border-t border-border pt-4">
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
                        <h4 className="text-xs font-medium text-muted">
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
                      reviewNotes={sub.stage2Review}
                      fields={{}}
                      docs={sub.stage2Docs}
                    />
                    <StageDocsBlock
                      title="Stage 3 · Business documents"
                      status={sub.stage3Status}
                      notes={sub.stage3Notes}
                      reviewNotes={sub.stage3Review}
                      fields={sub.stage3Fields}
                      docs={sub.stage3Docs}
                    />
                    <StageDocsBlock
                      title="Stage 4 · Professional documents"
                      status={sub.stage4Status}
                      notes={sub.stage4Notes}
                      reviewNotes={sub.stage4Review}
                      fields={sub.stage4Fields}
                      docs={sub.stage4Docs}
                    />

                    {v.notes &&
                    v.notes !== sub.stage2Notes &&
                    v.notes !== sub.stage3Notes &&
                    v.notes !== sub.stage4Notes ? (
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
                  <span className="text-sm font-medium">
                    Admin notes{" "}
                    <span className="font-normal text-muted">
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
                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
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
                        className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                      >
                        {isBusy
                          ? "Working…"
                          : `Approve ${pendingName}`}
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
                        className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                      >
                        Reject {pendingName}
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
                          className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
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
                          className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                        >
                          {isBusy ? "Working…" : "Approve Business"}
                        </button>
                      ) : null}
                      {sub.stage2Status === "verified" &&
                      sub.stage4Status !== "verified" ? (
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            runAction(
                              v.shop_id,
                              "approve",
                              `${shopName}: Professional approved.`,
                              4,
                            )
                          }
                          className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-sm font-medium transition-colors hover:bg-surface-subtle disabled:opacity-50"
                        >
                          {isBusy ? "Working…" : "Approve Professional"}
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
                        className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
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
                      className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-sm font-medium transition-colors hover:bg-surface-subtle disabled:opacity-50"
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

const FIELD_LABELS: Record<string, string> = {
  registered_name: "Registered business name",
  registration_number: "URSB registration number",
  tin: "TIN",
  profession: "Profession",
  licence_number: "Licence / membership number",
  issuing_body: "Issuing body",
};

function DocLightbox({ doc, label, onClose }: { doc: AdminVerificationDoc; label: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-modal flex flex-col bg-black/85 p-4"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 pb-3 text-white">
        <p className="truncate text-sm font-semibold">{label}</p>
        <div className="flex items-center gap-3">
          <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm underline" onClick={(e) => e.stopPropagation()}>
            Open original
          </a>
          <button type="button" onClick={onClose} className="dm-focus rounded-md px-2 py-1 text-sm font-semibold hover:bg-white/10">
            Close
          </button>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- admin review of uploaded documents */}
      <img src={doc.url} alt={label} className="mx-auto min-h-0 max-w-full flex-1 object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function StageDocsBlock({
  title,
  status,
  notes,
  reviewNotes,
  fields,
  docs,
}: {
  title: string;
  status: StageStatus;
  notes: string | null;
  reviewNotes: string | null;
  fields: Record<string, string>;
  docs: AdminVerificationDoc[];
}) {
  const [open, setOpen] = useState<{ doc: AdminVerificationDoc; label: string } | null>(null);
  const fieldEntries = Object.entries(fields).filter(([, v]) => String(v).trim());
  if (status === "unverified" && docs.length === 0 && !notes && fieldEntries.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-medium text-muted">
          {title}
        </h4>
        <VStatus status={status} />
      </div>
      {notes ? (
        <p className="rounded-lg border border-border bg-background p-2.5 text-xs text-foreground/80">
          <span className="font-semibold">Merchant note:</span> {notes}
        </p>
      ) : null}
      {reviewNotes ? (
        <p className="rounded-lg border border-border bg-background p-2.5 text-xs text-foreground/80">
          <span className="font-semibold">Reviewer note:</span> {reviewNotes}
        </p>
      ) : null}
      {fieldEntries.length ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          {fieldEntries.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] text-muted">{FIELD_LABELS[k] ?? k.replace(/_/g, " ")}</dt>
              <dd className="font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {open ? <DocLightbox doc={open.doc} label={open.label} onClose={() => setOpen(null)} /> : null}
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
                className="overflow-hidden rounded-md border border-border bg-background"
              >
                {isImageUrl(doc.url) ? (
                  <button type="button" className="dm-focus block w-full" onClick={() => setOpen({ doc, label })} aria-label={`View ${label}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin review of uploaded URLs */}
                    <img
                      src={doc.url}
                      alt={label}
                      className="h-36 w-full cursor-zoom-in object-cover"
                      loading="lazy"
                    />
                  </button>
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
