"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Verification, VerificationStatus } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/base";
import { platformActionMessage } from "@/lib/platformMessages";
import { useAppSession } from "@/lib/state";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { ImageUpload } from "@/components/image-upload";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { PageSkeleton, StatusDot, type StatusTone } from "@/components/dashboard/ui";

const BADGE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  shop_listed: {
    icon: "storefront",
    label: "Shop listed",
    color: "bg-primary/10 text-primary border-primary/20",
    desc: "Your shop is on Midora. You get this badge straight away. You don't need ID to post listings.",
  },
  identity_verified: {
    icon: "verified_user",
    label: "ID verified",
    color: "dm-pill--success border-[color:color-mix(in_oklab,var(--success)_25%,transparent)]",
    desc: "We checked your national ID, passport or driving permit. This lets you post more listings and buy paid plans.",
  },
  business_verified: {
    icon: "domain_verification",
    label: "Verified business",
    color: "bg-accent/15 text-accent border-accent/25",
    desc: "We checked your business registration, TIN or shop details.",
  },
  professional_verified: {
    icon: "workspace_premium",
    label: "Verified professional",
    color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
    desc: "We checked your professional licence or certificate.",
  },
};

function StatusPill({ status }: { status: VerificationStatus }) {
  const cfg: Record<VerificationStatus, { label: string; tone: StatusTone }> = {
    unverified: { label: "Not submitted", tone: "neutral" },
    submitted: { label: "Saved, not sent", tone: "warn" },
    pending: { label: "In review", tone: "warn" },
    verified: { label: "Verified", tone: "ok" },
    rejected: { label: "Changes requested", tone: "bad" },
  };
  const c = cfg[status] ?? cfg.unverified;
  return <StatusDot tone={c.tone}>{c.label}</StatusDot>;
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
  { type: "national_id_front", label: "National ID (front)" },
  { type: "national_id_back", label: "National ID (back)" },
  { type: "passport", label: "Passport (optional)" },
  { type: "driving_permit", label: "Driving permit (optional)" },
  { type: "selfie", label: "Selfie holding your ID" },
] as const;

const STAGE3_DOCS = [
  { type: "shop_photo", label: "Photo of your shop or workplace" },
  { type: "business_reg", label: "Business registration (optional)" },
  { type: "tin", label: "TIN certificate (optional)" },
  { type: "tax_doc", label: "Tax clearance (optional)" },
] as const;

const STAGE4_DOCS = [
  { type: "professional_cred", label: "Professional credential" },
  { type: "professional_license", label: "Licence or certificate (optional)" },
] as const;

const STAGE3_FIELDS = [
  { key: "registered_name", label: "Registered business name" },
  { key: "registration_number", label: "URSB registration number" },
  { key: "tin", label: "TIN (tax number)" },
] as const;

const STAGE4_FIELDS = [
  { key: "profession", label: "Profession" },
  { key: "licence_number", label: "Licence or membership number" },
  { key: "issuing_body", label: "Who issued it" },
] as const;

type DocType = string;
type Doc = { type: DocType; url: string; label: string };

function metaRecord(v: Verification | null): Record<string, unknown> {
  return (v?.metadata as Record<string, unknown>) ?? {};
}

function storedDocs(v: Verification | null, stage: 2 | 3 | 4): Doc[] {
  const raw = metaRecord(v)[`stage${stage}_docs`];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((d) => {
    const row = d as Record<string, unknown>;
    return typeof row?.url === "string" && typeof row?.type === "string"
      ? [{ type: row.type, url: row.url, label: typeof row.label === "string" ? row.label : row.type }]
      : [];
  });
}

function storedFields(v: Verification | null, stage: 3 | 4): Record<string, string> {
  const raw = metaRecord(v)[`stage${stage}_fields`];
  return raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
}

/** Reviewer reason, falling back to the old shared notes key. */
function reviewerNotes(v: Verification | null, stage: 2 | 3 | 4): string | null {
  const m = metaRecord(v);
  const value = m[`stage${stage}_review_notes`] ?? m[`stage${stage}_notes`];
  return typeof value === "string" && value.trim() ? value : null;
}

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

  const [s3Fields, setS3Fields] = useState<Record<string, string>>({});
  const [s4Fields, setS4Fields] = useState<Record<string, string>>({});
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
      // "Update documents" starts from what is already on file, so a resubmit
      // never silently drops earlier uploads.
      setS2Docs(storedDocs(v, 2));
      setS3Docs(storedDocs(v, 3));
      setS4Docs(storedDocs(v, 4));
      setS3Fields(storedFields(v, 3));
      setS4Fields(storedFields(v, 4));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setVerification(null);
      } else {
        setError(platformActionMessage(err, "We couldn't load your verification. Check your connection and try again."));
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
            ? { notes: s3Notes.trim() || undefined, documents: s3Docs, metadata: s3Fields, request_review: requestReview }
            : { notes: s4Notes.trim() || undefined, documents: s4Docs, metadata: s4Fields, request_review: requestReview };
      const v = await apiShops.submitForVerificationStage(shopId, stage, body);
      setVerification(v);
      setActiveForm(null);
    } catch (err) {
      setError(platformActionMessage(err, "We couldn't save your documents. Check your connection and try again."));
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
      setError(platformActionMessage(err, "We couldn't send your review request. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  // Realtime updates call load() again; only the first load shows a skeleton.
  if (loading && !verification) return <PageSkeleton rows={4} label="Loading verification…" />;

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
            Verification is optional. You can save your ID now and ask us to review it later.
            Ask for a review when you want more listings, a paid plan or a trust badge.
          </p>
        </div>

        <StageBlock
          number={1}
          title="Shop listed"
          icon="storefront"
          status="verified"
          badgeKey="shop_listed"
          hasBadge={badges.includes("shop_listed")}
          description="Your shop is live. To post listings you need a phone number, location, price and photos. No ID needed."
          autoGranted
        >
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/merchant/shops/${shopId}`} className="dm-btn dm-btn-secondary dm-btn-sm">
              Manage listings
            </Link>
          </div>
        </StageBlock>

        <StageBlock
          number={2}
          title="ID verified"
          icon="verified_user"
          status={stage2Status}
          badgeKey="identity_verified"
          hasBadge={badges.includes("identity_verified")}
          description="A selfie and your national ID, passport or driving permit. You need this to post more than 5 listings or buy the Standard or Premium plan."
        >
          {stage2Status === "rejected" && reviewerNotes(verification, 2) && (
            <div className="dm-alert dm-alert--error mt-3 px-4 py-3 text-xs">
              <strong>What to change:</strong> {reviewerNotes(verification, 2)}
            </div>
          )}

          {stage2Status === "submitted" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted">Your ID is saved. We’ll review it when you ask, or when you need it for more listings or a paid plan.</p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRequestReview(2)}
                className="dm-btn dm-btn-primary dm-btn-sm"
              >
                {submitting ? "Sending…" : "Ask for review"}
              </button>
            </div>
          )}

          {stage2Status === "pending" && (
            <p className="mt-3 text-sm text-muted">
              We’re checking your ID. This usually takes 1 working day.
            </p>
          )}

          {stage2Status === "verified" && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
              <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
              You have the ID verified badge.
            </div>
          )}

          {canCaptureStage2 && (
            <>
              {activeForm !== 2 ? (
                <button type="button" onClick={() => setActiveForm(2)} className="dm-btn dm-btn-primary dm-btn-sm mt-4">
                  {stage2Status === "rejected" ? "Send ID again" : stage2Status === "submitted" ? "Update documents" : "Add ID and selfie"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleSubmit(2, false); }}
                  className="mt-4 space-y-4 rounded-xl border border-border bg-surface shadow-xs p-4"
                >
                  <p className="text-xs font-semibold text-foreground/80">Your ID (optional)</p>
                  <p className="text-xs text-muted">
                    We keep your documents private. Saving doesn’t send them for review. Tap “Save and ask for review” when you want the badge.
                  </p>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Phone number</span>
                    <PhoneNumberInput value={s2Phone} onChange={setS2Phone} placeholder="772 123 456" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">WhatsApp number</span>
                    <PhoneNumberInput value={s2Whatsapp} onChange={setS2Whatsapp} placeholder="772 123 456" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Shop location</span>
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
                      {submitting ? "Saving…" : "Save for later"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || s2Docs.length === 0}
                      onClick={() => void handleSubmit(2, true)}
                      className="dm-btn dm-btn-primary disabled:opacity-60"
                    >
                      {submitting ? "Sending…" : "Save and ask for review"}
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
          title="Verified business"
          icon="domain_verification"
          status={stage3Status}
          badgeKey="business_verified"
          hasBadge={badges.includes("business_verified")}
          description="Your business registration, TIN or a shop photo, for the verified business badge."
          locked={stage2Status !== "verified"}
          lockedMessage="Get your ID verified first."
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
            metaNotes={reviewerNotes(verification, 3)}
            fieldsSpec={STAGE3_FIELDS}
            fields={s3Fields}
            setField={(key, value) => setS3Fields((f) => ({ ...f, [key]: value }))}
            captureLabel="Add business documents"
          />
        </StageBlock>

        <StageBlock
          number={4}
          title="Verified professional"
          icon="workspace_premium"
          status={stage4Status}
          badgeKey="professional_verified"
          hasBadge={badges.includes("professional_verified")}
          description="Your professional licence or certificate, if your work needs one."
          locked={stage2Status !== "verified"}
          lockedMessage="Get your ID verified first."
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
            metaNotes={reviewerNotes(verification, 4)}
            fieldsSpec={STAGE4_FIELDS}
            fields={s4Fields}
            setField={(key, value) => setS4Fields((f) => ({ ...f, [key]: value }))}
            captureLabel="Add licence or certificate"
          />
        </StageBlock>
      </div>

      <div className="dm-card p-5 sm:p-6">
        <p className="mb-4 text-sm font-semibold">What the badges mean</p>
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
                    <span className="ml-2 text-[10px] font-semibold" style={{ color: "var(--success)" }}>✓ You have this</span>
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
          <div key={dt.type} className="space-y-1.5 rounded-xl border border-border bg-surface shadow-xs px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/80">{dt.label}</span>
              {existing && (
                <button type="button" onClick={() => onRemove(dt.type)} className="text-[10px] hover:underline" style={{ color: "var(--error)" }}>
                  Remove
                </button>
              )}
            </div>
            {existing ? (
              <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: "var(--success)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- private document preview */}
                <img src={existing.url} alt="" className="size-12 rounded-md border border-border object-cover" />
                <MaterialSymbol name="check_circle" className="!text-xs" aria-hidden="true" />
                Uploaded
              </div>
            ) : (
              <ImageUpload
                endpoint="verificationDoc"
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
  fieldsSpec, fields, setField,
}: {
  fieldsSpec?: readonly { key: string; label: string }[];
  fields?: Record<string, string>;
  setField?: (key: string, value: string) => void;
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
          <strong>What to change:</strong> {String(metaNotes)}
        </div>
      )}
      {status === "submitted" && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted">Your documents are saved. We’ll review them when you ask.</p>
          <button type="button" disabled={submitting} onClick={onRequestReview} className="dm-btn dm-btn-primary dm-btn-sm">
            {submitting ? "Sending…" : "Ask for review"}
          </button>
        </div>
      )}
      {status === "pending" && (
        <p className="mt-3 text-sm text-muted">We’re checking your documents.</p>
      )}
      {status === "verified" && (
        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
          <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
          You have this badge.
        </div>
      )}
      {canCapture && status !== "pending" && (
        <>
          {!active ? (
            <button type="button" onClick={onOpen} className="dm-btn dm-btn-primary dm-btn-sm mt-4">
              {status === "rejected" ? "Send documents again" : status === "submitted" ? "Update documents" : captureLabel}
            </button>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); onSave(); }}
              className="mt-4 space-y-4 rounded-xl border border-border bg-surface shadow-xs p-4"
            >
              {fieldsSpec?.length ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {fieldsSpec.map((f) => (
                    <label key={f.key} className="block space-y-1">
                      <span className="text-xs font-medium text-foreground/80">{f.label}</span>
                      <input
                        className="dm-input"
                        value={fields?.[f.key] ?? ""}
                        onChange={(e) => setField?.(f.key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              ) : null}
              <DocUploadList docs={docsSpec} values={docs} onAdd={onAdd} onRemove={onRemove} />
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground/80">Notes (optional)</span>
                <textarea className="dm-textarea !min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={submitting || docs.length === 0} className="dm-btn dm-btn-secondary disabled:opacity-60">
                  {submitting ? "Saving…" : "Save for later"}
                </button>
                <button type="button" disabled={submitting || docs.length === 0} onClick={onReview} className="dm-btn dm-btn-primary disabled:opacity-60">
                  {submitting ? "Sending…" : "Save and ask for review"}
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
  number, title, status, badgeKey, hasBadge, description, autoGranted,
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
            <p className="text-sm font-semibold">{title}</p>
            {autoGranted && (
              <span className="text-xs text-muted">
                Automatic
              </span>
            )}
            {hasBadge && meta && meta.label !== title && (
              <span className="text-xs text-foreground/80">
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
