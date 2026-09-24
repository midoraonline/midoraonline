"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Verification, VerificationStatus } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { ImageUpload } from "@/components/image-upload";
import PhoneNumberInput from "@/components/PhoneNumberInput";

const BADGE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  shop_listed: {
    icon: "storefront",
    label: "Shop Listed",
    color: "bg-primary/10 text-primary border-primary/20",
    desc: "Your shop is registered on Midora. Earned automatically — no KYC required to publish.",
  },
  identity_verified: {
    icon: "verified_user",
    label: "Identity Verified",
    color: "dm-pill--success border-[color:color-mix(in_oklab,var(--success)_25%,transparent)]",
    desc: "National ID / passport / driving permit confirmed. Unlocks higher listing volume and paid plans.",
  },
  business_verified: {
    icon: "domain_verification",
    label: "Verified Business",
    color: "bg-accent/15 text-accent border-accent/25",
    desc: "Business registration / TIN / shop contacts verified by Midora.",
  },
  professional_verified: {
    icon: "workspace_premium",
    label: "Verified Professional",
    color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
    desc: "Professional credentials confirmed where relevant (licenses, certificates).",
  },
};

function StatusPill({ status }: { status: VerificationStatus }) {
  const cfg: Record<VerificationStatus, { label: string; cls: string }> = {
    unverified: { label: "Not submitted", cls: "dm-pill--muted" },
    submitted: { label: "ID submitted", cls: "dm-pill--warning" },
    pending: { label: "Verification pending", cls: "dm-pill--warning" },
    verified: { label: "Approved", cls: "dm-pill--success" },
    rejected: { label: "Changes requested", cls: "dm-pill--error" },
  };
  const c = cfg[status] ?? cfg.unverified;
  return (
    <span className={`dm-pill ${c.cls} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
      {c.label}
    </span>
  );
}

function StageCircle({
  stage, status, active,
}: {
  stage: number;
  status: VerificationStatus;
  active: boolean;
}) {
  const base = "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all";
  if (status === "verified")
    return (
      <div className={`${base} dm-pill--success`} style={{ borderColor: "color-mix(in oklab, var(--success) 45%, transparent)" }}>
        <MaterialSymbol name="check" className="!text-base" aria-hidden="true" />
      </div>
    );
  if (status === "pending" || status === "submitted")
    return (
      <div className={`${base} dm-pill--warning`} style={{ borderColor: "color-mix(in oklab, var(--warning) 45%, transparent)" }}>
        <MaterialSymbol name="hourglass_top" className="!text-base" aria-hidden="true" />
      </div>
    );
  if (status === "rejected")
    return (
      <div className={`${base} dm-pill--error`} style={{ borderColor: "color-mix(in oklab, var(--error) 45%, transparent)" }}>
        <MaterialSymbol name="close" className="!text-base" aria-hidden="true" />
      </div>
    );
  if (active)
    return (
      <div className={`${base} border-accent bg-accent/10 text-accent`}>
        {stage}
      </div>
    );
  return (
    <div className={`${base} border-border bg-surface-subtle text-muted`}>
      {stage}
    </div>
  );
}

const STAGE2_DOCS = [
  { type: "national_id_front", label: "National ID (Front)" },
  { type: "national_id_back", label: "National ID (Back)" },
  { type: "passport", label: "Passport (optional)" },
  { type: "driving_permit", label: "Driving permit (optional)" },
  { type: "selfie", label: "Selfie with ID" },
] as const;

const STAGE3_DOCS = [
  { type: "shop_photo", label: "Physical Shop Photo" },
  { type: "business_reg", label: "Business Registration (optional)" },
  { type: "tin", label: "TIN document (optional)" },
  { type: "tax_doc", label: "Tax Compliance (optional)" },
] as const;

const STAGE4_DOCS = [
  { type: "professional_cred", label: "Professional credential" },
  { type: "professional_license", label: "License / certificate (optional)" },
] as const;

type DocType = string;

export default function ShopVerificationCard({ shopId }: { shopId: string }) {
  const session = useAppSession();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeForm, setActiveForm] = useState<2 | 3 | 4 | null>(null);

  const [s2Phone, setS2Phone] = useState("");
  const [s2Whatsapp, setS2Whatsapp] = useState("");
  const [s2Location, setS2Location] = useState("");
  const [s2Notes, setS2Notes] = useState("");
  const [s2Docs, setS2Docs] = useState<{ type: DocType; url: string; label: string }[]>([]);

  const [s3Notes, setS3Notes] = useState("");
  const [s3Docs, setS3Docs] = useState<{ type: DocType; url: string; label: string }[]>([]);
  const [s4Notes, setS4Notes] = useState("");
  const [s4Docs, setS4Docs] = useState<{ type: DocType; url: string; label: string }[]>([]);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const v = await apiShops.getVerification(shopId);
      setVerification(v);
      if (v.submitted_phone) setS2Phone(v.submitted_phone);
      if (v.submitted_whatsapp) setS2Whatsapp(v.submitted_whatsapp);
      if (v.submitted_location) setS2Location(v.submitted_location);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setVerification(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load verification");
      }
    } finally {
      setLoading(false);
    }
  }, [shopId, session.isAuthenticated]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (!session.isAuthenticated) { setLoading(false); return; }
    load();
  }, [load, session.hydrated, session.isAuthenticated]);

  useRealtimeTable(
    { table: "shop_verifications", channel: `shop-verification:${shopId}`, filter: `shop_id=eq.${shopId}`, enabled: !!shopId },
    () => void load(),
  );

  function addDoc(stage: 2 | 3 | 4, type: DocType, label: string, url: string) {
    const setter = stage === 2 ? setS2Docs : stage === 3 ? setS3Docs : setS4Docs;
    setter(prev => [...prev.filter(d => d.type !== type), { type, url, label }]);
  }

  function removeDoc(stage: 2 | 3 | 4, type: string) {
    const setter = stage === 2 ? setS2Docs : stage === 3 ? setS3Docs : setS4Docs;
    setter(prev => prev.filter(d => d.type !== type));
  }

  async function handleSubmit(stage: 2 | 3 | 4, requestReview: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const body =
        stage === 2
          ? {
              notes: s2Notes.trim() || undefined,
              documents: s2Docs,
              submitted_phone: s2Phone.trim() || undefined,
              submitted_whatsapp: s2Whatsapp.trim() || undefined,
              submitted_location: s2Location.trim() || undefined,
              request_review: requestReview,
            }
          : stage === 3
            ? { notes: s3Notes.trim() || undefined, documents: s3Docs, request_review: requestReview }
            : { notes: s4Notes.trim() || undefined, documents: s4Docs, request_review: requestReview };
      const v = await apiShops.submitForVerificationStage(shopId, stage, body);
      setVerification(v);
      setActiveForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestReview(stage: 2 | 3 | 4) {
    setSubmitting(true);
    setError(null);
    try {
      const v = await apiShops.requestVerificationReview(shopId, { stage });
      setVerification(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="dm-card p-8 text-sm text-muted">Loading verification status…</div>;

  const badges = verification?.badges ?? ["shop_listed"];
  const stage2Status = verification?.stage2_status ?? "unverified";
  const stage3Status = verification?.stage3_status ?? "unverified";
  const stage4Status = verification?.stage4_status ?? "unverified";

  const canCaptureStage2 = stage2Status === "unverified" || stage2Status === "rejected" || stage2Status === "submitted";
  const canCaptureStage3 =
    stage2Status === "verified" &&
    (stage3Status === "unverified" || stage3Status === "rejected" || stage3Status === "submitted");
  const canCaptureStage4 =
    stage2Status === "verified" &&
    (stage4Status === "unverified" || stage4Status === "rejected" || stage4Status === "submitted");

  return (
    <div className="space-y-6">
      {error && (
        <div className="dm-alert dm-alert--error px-4 py-3 text-sm">{error}</div>
      )}

      <div className="dm-card overflow-hidden divide-y divide-border">
        <div className="bg-surface-subtle px-5 py-4 sm:px-6">
          <p className="text-sm text-muted">
            Optional ID capture first — we store your selfie + ID without reviewing everyone.
            Request review when you need unlocks (more listings, paid plans) or higher trust badges.
          </p>
        </div>

        <StageBlock
          number={1}
          title="Shop Listed"
          icon="storefront"
          status="verified"
          badgeKey="shop_listed"
          hasBadge={badges.includes("shop_listed")}
          description="Your shop is live. Basic publish needs phone, place, price, and photos — not KYC."
          autoGranted
        >
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/merchant/shops/${shopId}`} className="dm-btn dm-btn-secondary dm-btn-sm">
              Manage catalog →
            </Link>
          </div>
        </StageBlock>

        <StageBlock
          number={2}
          title="Identity Verified"
          icon="verified_user"
          status={stage2Status}
          badgeKey="identity_verified"
          hasBadge={badges.includes("identity_verified")}
          description="Optional selfie + national ID / passport / driving permit. Required to list more than 5 items or upgrade to Standard/Premium."
        >
          {stage2Status === "rejected" && Boolean((verification?.metadata as Record<string, unknown>)?.stage2_notes) && (
            <div className="dm-alert dm-alert--error mt-3 px-4 py-3 text-xs">
              <strong>Reviewer notes:</strong>{" "}
              {String((verification?.metadata as Record<string, unknown>).stage2_notes)}
            </div>
          )}

          {stage2Status === "submitted" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted">ID submitted — verification pending until you request review or hit an unlock.</p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRequestReview(2)}
                className="dm-btn dm-btn-primary dm-btn-sm"
              >
                {submitting ? "Requesting…" : "Request review now"}
              </button>
            </div>
          )}

          {stage2Status === "pending" && (
            <p className="mt-3 text-sm text-muted">
              Verification pending — Midora is reviewing your ID. Usually within 1 business day.
            </p>
          )}

          {stage2Status === "verified" && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
              <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
              Identity Verified badge earned.
            </div>
          )}

          {canCaptureStage2 && stage2Status !== "pending" && (
            <>
              {activeForm !== 2 ? (
                <button type="button" onClick={() => setActiveForm(2)} className="dm-btn dm-btn-primary dm-btn-sm mt-4">
                  {stage2Status === "rejected" ? "Resubmit ID documents" : stage2Status === "submitted" ? "Update documents" : "Capture ID + selfie →"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleSubmit(2, false); }}
                  className="mt-4 space-y-4 rounded-xl border border-border bg-surface-subtle p-4"
                >
                  <p className="text-xs font-semibold text-foreground/80">Identity capture (optional)</p>
                  <p className="text-xs text-muted">
                    Docs are stored privately. Saving does not put you in the admin queue — use Request review when you need the badge.
                  </p>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Phone number</span>
                    <PhoneNumberInput value={s2Phone} onChange={setS2Phone} placeholder="700 000 000" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">WhatsApp number</span>
                    <PhoneNumberInput value={s2Whatsapp} onChange={setS2Whatsapp} placeholder="700 000 000" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Physical location</span>
                    <input type="text" className="dm-input" value={s2Location} onChange={e => setS2Location(e.target.value)}
                      placeholder="e.g. Shop 12, Nakawa Market, Kampala" />
                  </label>

                  <DocUploadList
                    docs={STAGE2_DOCS}
                    values={s2Docs}
                    onAdd={(type, label, url) => addDoc(2, type, label, url)}
                    onRemove={(type) => removeDoc(2, type)}
                  />

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Notes (optional)</span>
                    <textarea className="dm-textarea !min-h-[80px]" value={s2Notes} onChange={e => setS2Notes(e.target.value)} />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={submitting || s2Docs.length === 0} className="dm-btn dm-btn-secondary disabled:opacity-60">
                      {submitting ? "Saving…" : "Save ID (no review yet)"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || s2Docs.length === 0}
                      onClick={() => void handleSubmit(2, true)}
                      className="dm-btn dm-btn-primary disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Save & request review"}
                    </button>
                    <button type="button" onClick={() => setActiveForm(null)} className="dm-btn dm-btn-ghost dm-btn-sm">Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </StageBlock>

        <StageBlock
          number={3}
          title="Verified Business"
          icon="domain_verification"
          status={stage3Status}
          badgeKey="business_verified"
          hasBadge={badges.includes("business_verified")}
          description="Business registration / TIN / shop photo when you need a business badge."
          locked={stage2Status !== "verified"}
          lockedMessage="Identity Verified required before business verification."
        >
          <StageActions
            status={stage3Status}
            canCapture={canCaptureStage3}
            active={activeForm === 3}
            submitting={submitting}
            notes={s3Notes}
            setNotes={setS3Notes}
            docsSpec={STAGE3_DOCS}
            docs={s3Docs}
            onOpen={() => setActiveForm(3)}
            onClose={() => setActiveForm(null)}
            onAdd={(t, l, u) => addDoc(3, t, l, u)}
            onRemove={(t) => removeDoc(3, t)}
            onSave={() => void handleSubmit(3, false)}
            onReview={() => void handleSubmit(3, true)}
            onRequestReview={() => void handleRequestReview(3)}
            metaNotes={(verification?.metadata as Record<string, unknown>)?.stage3_notes}
            captureLabel="Capture business docs →"
          />
        </StageBlock>

        <StageBlock
          number={4}
          title="Verified Professional"
          icon="workspace_premium"
          status={stage4Status}
          badgeKey="professional_verified"
          hasBadge={badges.includes("professional_verified")}
          description="Optional professional credentials (licenses, certificates) where relevant."
          locked={stage2Status !== "verified"}
          lockedMessage="Identity Verified required before professional verification."
        >
          <StageActions
            status={stage4Status}
            canCapture={canCaptureStage4}
            active={activeForm === 4}
            submitting={submitting}
            notes={s4Notes}
            setNotes={setS4Notes}
            docsSpec={STAGE4_DOCS}
            docs={s4Docs}
            onOpen={() => setActiveForm(4)}
            onClose={() => setActiveForm(null)}
            onAdd={(t, l, u) => addDoc(4, t, l, u)}
            onRemove={(t) => removeDoc(4, t)}
            onSave={() => void handleSubmit(4, false)}
            onReview={() => void handleSubmit(4, true)}
            onRequestReview={() => void handleRequestReview(4)}
            metaNotes={(verification?.metadata as Record<string, unknown>)?.stage4_notes}
            captureLabel="Capture credentials →"
          />
        </StageBlock>
      </div>

      <div className="dm-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">What your badges mean</p>
        <div className="space-y-3">
          {Object.entries(BADGE_META).map(([key, b]) => (
            <div key={key} className="flex items-start gap-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${b.color}`}>
                <MaterialSymbol name={b.icon} className="!text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {b.label}
                  {badges.includes(key) && (
                    <span className="ml-2 text-[10px] font-semibold" style={{ color: "var(--success)" }}>✓ Earned</span>
                  )}
                </p>
                <p className="text-xs text-muted">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocUploadList({
  docs, values, onAdd, onRemove,
}: {
  docs: readonly { type: string; label: string }[];
  values: { type: string; url: string; label: string }[];
  onAdd: (type: string, label: string, url: string) => void;
  onRemove: (type: string) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-foreground/80">Documents</span>
      {docs.map(dt => {
        const existing = values.find(d => d.type === dt.type);
        return (
          <div key={dt.type} className="rounded-xl bg-surface px-3 py-2.5 ring-1 ring-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/80">{dt.label}</span>
              {existing && (
                <button type="button" onClick={() => onRemove(dt.type)} className="text-[10px] hover:underline" style={{ color: "var(--error)" }}>
                  Remove
                </button>
              )}
            </div>
            {existing ? (
              <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: "var(--success)" }}>
                <MaterialSymbol name="check_circle" className="!text-xs" aria-hidden="true" />
                Uploaded
              </div>
            ) : (
              <ImageUpload
                endpoint="imageUploader"
                label={`Upload ${dt.label}`}
                onUploadComplete={(url) => onAdd(dt.type, dt.label, url)}
                className=""
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StageActions({
  status, canCapture, active, submitting, notes, setNotes, docsSpec, docs,
  onOpen, onClose, onAdd, onRemove, onSave, onReview, onRequestReview, metaNotes, captureLabel,
}: {
  status: VerificationStatus;
  canCapture: boolean;
  active: boolean;
  submitting: boolean;
  notes: string;
  setNotes: (v: string) => void;
  docsSpec: readonly { type: string; label: string }[];
  docs: { type: string; url: string; label: string }[];
  onOpen: () => void;
  onClose: () => void;
  onAdd: (type: string, label: string, url: string) => void;
  onRemove: (type: string) => void;
  onSave: () => void;
  onReview: () => void;
  onRequestReview: () => void;
  metaNotes?: unknown;
  captureLabel: string;
}) {
  return (
    <>
      {status === "rejected" && Boolean(metaNotes) && (
        <div className="dm-alert dm-alert--error mt-3 px-4 py-3 text-xs">
          <strong>Reviewer notes:</strong> {String(metaNotes)}
        </div>
      )}
      {status === "submitted" && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted">Documents submitted — verification pending until review is requested.</p>
          <button type="button" disabled={submitting} onClick={onRequestReview} className="dm-btn dm-btn-primary dm-btn-sm">
            {submitting ? "Requesting…" : "Request review now"}
          </button>
        </div>
      )}
      {status === "pending" && (
        <p className="mt-3 text-sm text-muted">Verification pending — under Midora review.</p>
      )}
      {status === "verified" && (
        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
          <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
          Badge earned.
        </div>
      )}
      {canCapture && status !== "pending" && (
        <>
          {!active ? (
            <button type="button" onClick={onOpen} className="dm-btn dm-btn-primary dm-btn-sm mt-4">
              {status === "rejected" ? "Resubmit documents" : status === "submitted" ? "Update documents" : captureLabel}
            </button>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); onSave(); }}
              className="mt-4 space-y-4 rounded-xl border border-border bg-surface-subtle p-4"
            >
              <DocUploadList docs={docsSpec} values={docs} onAdd={onAdd} onRemove={onRemove} />
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground/80">Notes (optional)</span>
                <textarea className="dm-textarea !min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={submitting || docs.length === 0} className="dm-btn dm-btn-secondary disabled:opacity-60">
                  {submitting ? "Saving…" : "Save (no review yet)"}
                </button>
                <button type="button" disabled={submitting || docs.length === 0} onClick={onReview} className="dm-btn dm-btn-primary disabled:opacity-60">
                  {submitting ? "Submitting…" : "Save & request review"}
                </button>
                <button type="button" onClick={onClose} className="dm-btn dm-btn-ghost dm-btn-sm">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </>
  );
}

function StageBlock({
  number, title, icon, status, badgeKey, hasBadge, description, autoGranted,
  locked, lockedMessage, children,
}: {
  number: number;
  title: string;
  icon: string;
  status: VerificationStatus;
  badgeKey: string;
  hasBadge: boolean;
  description: string;
  autoGranted?: boolean;
  locked?: boolean;
  lockedMessage?: string;
  children?: React.ReactNode;
}) {
  const meta = BADGE_META[badgeKey];
  return (
    <div className={`p-5 sm:p-6 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <StageCircle stage={number} status={status} active={!locked} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-semibold tracking-tight">{title}</p>
            {autoGranted && (
              <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wide">
                Auto
              </span>
            )}
            {hasBadge && meta && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                <MaterialSymbol name={meta.icon} className="!text-xs" />
                {meta.label}
              </span>
            )}
            {!autoGranted && <StatusPill status={status} />}
          </div>
          <p className="mt-1 text-sm text-muted">{description}</p>
          {locked && lockedMessage && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <MaterialSymbol name="lock" className="!text-sm" />
              {lockedMessage}
            </p>
          )}
          {!locked && children}
        </div>
      </div>
    </div>
  );
}
