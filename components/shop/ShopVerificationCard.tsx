"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Verification, VerificationStatus } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductFormModal from "@/components/shop/ProductFormModal";
import { ImageUpload } from "@/components/image-upload";
import PhoneNumberInput from "@/components/PhoneNumberInput";

// ── Badge metadata ────────────────────────────────────────────────────────────
const BADGE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  shop_listed: {
    icon: "storefront",
    label: "Shop Listed",
    color: "bg-primary/10 text-primary border-primary/20",
    desc: "Your shop is registered on Midora. Every shop on the platform earns this badge automatically.",
  },
  identity_verified: {
    icon: "verified_user",
    label: "Identity Verified",
    color: "dm-pill--success border-[color:color-mix(in_oklab,var(--success)_25%,transparent)]",
    desc: "Your identity has been confirmed by the Midora team. Customers can trust this is a real person behind the shop.",
  },
  business_verified: {
    icon: "domain_verification",
    label: "Business Verified",
    color: "bg-accent/15 text-accent border-accent/25",
    desc: "Your physical business has been verified. This is the highest trust level on Midora.",
  },
};

// ── Stage status pill ─────────────────────────────────────────────────────────
function StatusPill({ status }: { status: VerificationStatus }) {
  const cfg: Record<VerificationStatus, { label: string; cls: string }> = {
    unverified: { label: "Not submitted", cls: "dm-pill--muted" },
    pending:    { label: "Under review",  cls: "dm-pill--warning" },
    verified:   { label: "Approved",      cls: "dm-pill--success" },
    rejected:   { label: "Changes requested", cls: "dm-pill--error" },
  };
  const c = cfg[status] ?? cfg.unverified;
  return (
    <span className={`dm-pill ${c.cls} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
      {c.label}
    </span>
  );
}

// ── Individual stage circle icon ──────────────────────────────────────────────
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
      <div
        className={`${base} dm-pill--success`}
        style={{ borderColor: "color-mix(in oklab, var(--success) 45%, transparent)" }}
      >
        <MaterialSymbol name="check" className="!text-base" aria-hidden="true" />
      </div>
    );
  if (status === "pending")
    return (
      <div
        className={`${base} dm-pill--warning`}
        style={{ borderColor: "color-mix(in oklab, var(--warning) 45%, transparent)" }}
      >
        <MaterialSymbol name="hourglass_top" className="!text-base" aria-hidden="true" />
      </div>
    );
  if (status === "rejected")
    return (
      <div
        className={`${base} dm-pill--error`}
        style={{ borderColor: "color-mix(in oklab, var(--error) 45%, transparent)" }}
      >
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

// ── Document type definitions per stage ──────────────────────────────────────
const STAGE2_DOCS = [
  { type: "national_id_front", label: "National ID (Front)" },
  { type: "national_id_back",  label: "National ID (Back)" },
  { type: "selfie",            label: "Selfie with ID" },
  { type: "business_cert",     label: "Business Certificate (optional)" },
] as const;

const STAGE3_DOCS = [
  { type: "shop_photo",    label: "Physical Shop Photo" },
  { type: "business_reg",  label: "Business Registration (optional)" },
  { type: "tax_doc",       label: "Tax Compliance Document (optional)" },
] as const;

type DocType = typeof STAGE2_DOCS[number]["type"] | typeof STAGE3_DOCS[number]["type"];

// ── Main component ─────────────────────────────────────────────────────────────
export default function ShopVerificationCard({ shopId }: { shopId: string }) {
  const session = useAppSession();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeForm, setActiveForm] = useState<2 | 3 | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Stage 2 form state
  const [s2Phone, setS2Phone] = useState("");
  const [s2Whatsapp, setS2Whatsapp] = useState("");
  const [s2Location, setS2Location] = useState("");
  const [s2Notes, setS2Notes] = useState("");
  const [s2Docs, setS2Docs] = useState<{ type: DocType; url: string; label: string }[]>([]);

  // Stage 3 form state
  const [s3Notes, setS3Notes] = useState("");
  const [s3Docs, setS3Docs] = useState<{ type: DocType; url: string; label: string }[]>([]);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const v = await apiShops.getVerification(shopId);
      setVerification(v);
      // Pre-fill stage 2 fields if present
      if (v.submitted_phone)   setS2Phone(v.submitted_phone);
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

  function addDoc(stage: 2 | 3, type: DocType, label: string, url: string) {
    const setter = stage === 2 ? setS2Docs : setS3Docs;
    setter(prev => [...prev.filter(d => d.type !== type), { type, url, label }]);
  }

  function removeDoc(stage: 2 | 3, type: string) {
    const setter = stage === 2 ? setS2Docs : setS3Docs;
    setter(prev => prev.filter(d => d.type !== type));
  }

  async function handleSubmit(stage: 2 | 3) {
    setSubmitting(true);
    setError(null);
    try {
      const body = stage === 2
        ? { notes: s2Notes.trim() || undefined, documents: s2Docs, submitted_phone: s2Phone.trim() || undefined, submitted_whatsapp: s2Whatsapp.trim() || undefined, submitted_location: s2Location.trim() || undefined }
        : { notes: s3Notes.trim() || undefined, documents: s3Docs };
      const v = await apiShops.submitForVerificationStage(shopId, stage, body);
      setVerification(v);
      setActiveForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="dm-card p-8 text-sm text-muted">Loading verification status…</div>;

  const badges = verification?.badges ?? ["shop_listed"];
  const stage2Status = verification?.stage2_status ?? "unverified";
  const stage3Status = verification?.stage3_status ?? "unverified";

  const canSubmitStage2 = stage2Status === "unverified" || stage2Status === "rejected";
  const canSubmitStage3 = stage2Status === "verified" && (stage3Status === "unverified" || stage3Status === "rejected");

  return (
    <div className="space-y-6">
      {/* ── Page intro ──────────────────────────────────────── */}
      <div className="dm-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Verification Journey</p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Build trust with buyers</h2>
        <p className="mt-1 text-sm text-muted">
          Complete each stage to earn trust badges. Badges appear on your public shop page and help customers feel confident buying from you.
        </p>
      </div>

      {error && (
        <p className="dm-alert dm-alert--error px-4 py-3 text-sm">{error}</p>
      )}

      {/* ── Stage stepper ────────────────────────────────────── */}
      <div className="dm-card divide-y divide-border overflow-hidden">

        {/* Stage 1 — Auto ──────────────────────────────── */}
        <StageBlock
          number={1}
          title="Shop Listed"
          icon="storefront"
          status="verified"
          badgeKey="shop_listed"
          hasBadge={badges.includes("shop_listed")}
          description="Your shop is registered on Midora. This badge is automatically granted to every shop on the platform."
          autoGranted
        >
          {/* Add Product CTA always shown after Stage 1 */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="dm-btn dm-btn-primary dm-btn-sm gap-1.5"
            >
              <MaterialSymbol name="add_circle" className="!text-base" />
              Add your first product
            </button>
            <Link
              href={`/merchant/shops/${shopId}/catalog`}
              className="dm-btn dm-btn-secondary dm-btn-sm"
            >
              Manage catalog →
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            You can add products and manage your catalog at any time — verification and products are independent.
          </p>
        </StageBlock>

        {/* Stage 2 — Identity ──────────────────────────── */}
        <StageBlock
          number={2}
          title="Identity Verified"
          icon="verified_user"
          status={stage2Status}
          badgeKey="identity_verified"
          hasBadge={badges.includes("identity_verified")}
          description="Share your NIN/ID documents and contact details so we can confirm you're a real person. Earns you the Identity Verified badge."
        >
          {/* Reviewer notes on rejection */}
          {stage2Status === "rejected" && Boolean((verification?.metadata as Record<string, unknown>)?.stage2_notes) && (
            <div className="dm-alert dm-alert--error mt-3 px-4 py-3 text-xs">
              <strong>Reviewer notes:</strong>{" "}
              {String((verification?.metadata as Record<string, unknown>).stage2_notes)}
            </div>
          )}

          {/* Pending state */}
          {stage2Status === "pending" && (
            <p className="mt-3 text-sm text-muted">
              Your submission is under review. We&apos;ll email you when a decision is made — usually within 1 business day.
            </p>
          )}

          {/* Approved state */}
          {stage2Status === "verified" && (
            <div
              className="mt-3 flex items-center gap-2 text-sm"
              style={{ color: "var(--success)" }}
            >
              <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
              Identity Verified badge earned! Proceed to Stage 3 to get the Business Verified badge.
            </div>
          )}

          {/* Submit form */}
          {canSubmitStage2 && (
            <>
              {activeForm !== 2 ? (
                <button
                  type="button"
                  onClick={() => setActiveForm(2)}
                  className="dm-btn dm-btn-primary dm-btn-sm mt-4"
                >
                  {stage2Status === "rejected" ? "Resubmit documents" : "Start Identity Verification →"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleSubmit(2); }}
                  className="mt-4 space-y-4 rounded-xl border border-border bg-surface-subtle p-4"
                >
                  <p className="text-xs font-semibold text-foreground/80">Identity Verification — Stage 2</p>
                  <p className="text-xs text-muted">
                    All fields marked * are required. Your information is reviewed securely by the Midora team and never shared publicly.
                  </p>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Phone number *</span>
                    <PhoneNumberInput
                      value={s2Phone}
                      onChange={setS2Phone}
                      placeholder="700 000 000"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">WhatsApp number *</span>
                    <PhoneNumberInput
                      value={s2Whatsapp}
                      onChange={setS2Whatsapp}
                      placeholder="700 000 000"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Physical location *</span>
                    <input type="text" className="dm-input" value={s2Location} onChange={e => setS2Location(e.target.value)}
                      placeholder="e.g. Shop 12, Nakawa Market, Kampala" required />
                  </label>

                  <div className="space-y-3">
                    <span className="text-xs font-medium text-foreground/80">Documents * (minimum: National ID front + back)</span>
                    {STAGE2_DOCS.map(dt => {
                      const existing = s2Docs.find(d => d.type === dt.type);
                      return (
                        <div key={dt.type} className="rounded-xl bg-surface px-3 py-2.5 ring-1 ring-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground/80">{dt.label}</span>
                            {existing && (
                              <button
                                type="button"
                                onClick={() => removeDoc(2, dt.type)}
                                className="text-[10px] hover:underline"
                                style={{ color: "var(--error)" }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {existing ? (
                            <div
                              className="flex items-center gap-1.5 text-[10px] font-medium"
                              style={{ color: "var(--success)" }}
                            >
                              <MaterialSymbol name="check_circle" className="!text-xs" aria-hidden="true" />
                              Uploaded
                            </div>
                          ) : (
                            <ImageUpload
                              endpoint="imageUploader"
                              label={`Upload ${dt.label}`}
                              onUploadComplete={(url) => addDoc(2, dt.type as DocType, dt.label, url)}
                              className=""
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Notes for the reviewer (optional)</span>
                    <textarea className="dm-textarea !min-h-[80px]" value={s2Notes} onChange={e => setS2Notes(e.target.value)}
                      placeholder="Any additional context that helps verify your identity." />
                  </label>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={submitting}
                      className="dm-btn dm-btn-primary disabled:opacity-60">
                      {submitting ? "Submitting…" : "Submit for review"}
                    </button>
                    <button type="button" onClick={() => setActiveForm(null)} className="dm-btn dm-btn-ghost dm-btn-sm">Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </StageBlock>

        {/* Stage 3 — Business ──────────────────────────── */}
        <StageBlock
          number={3}
          title="Business Verified"
          icon="domain_verification"
          status={stage3Status}
          badgeKey="business_verified"
          hasBadge={badges.includes("business_verified")}
          description="Share a photo of your physical shop location and optional registration documents. This is the highest trust level on Midora."
          locked={stage2Status !== "verified"}
          lockedMessage="Complete Identity Verification (Stage 2) first to unlock this stage."
        >
          {stage3Status === "rejected" && Boolean((verification?.metadata as Record<string, unknown>)?.stage3_notes) && (
            <div className="dm-alert dm-alert--error mt-3 px-4 py-3 text-xs">
              <strong>Reviewer notes:</strong>{" "}
              {String((verification?.metadata as Record<string, unknown>).stage3_notes)}
            </div>
          )}

          {stage3Status === "pending" && (
            <p className="mt-3 text-sm text-muted">
              Your business verification is under review. We&apos;ll email you within 1 business day.
            </p>
          )}

          {stage3Status === "verified" && (
            <div
              className="mt-3 flex items-center gap-2 text-sm"
              style={{ color: "var(--success)" }}
            >
              <MaterialSymbol name="check_circle" className="!text-base" aria-hidden="true" />
              Business Verified badge earned! You&apos;ve completed all verification stages.
            </div>
          )}

          {canSubmitStage3 && (
            <>
              {activeForm !== 3 ? (
                <button type="button" onClick={() => setActiveForm(3)} className="dm-btn dm-btn-primary dm-btn-sm mt-4">
                  {stage3Status === "rejected" ? "Resubmit documents" : "Start Business Verification →"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleSubmit(3); }}
                  className="mt-4 space-y-4 rounded-xl border border-border bg-surface-subtle p-4"
                >
                  <p className="text-xs font-semibold text-foreground/80">Business Verification — Stage 3</p>
                  <p className="text-xs text-muted">
                    Share evidence of your physical business. This helps build maximum trust with buyers.
                  </p>

                  <div className="space-y-3">
                    <span className="text-xs font-medium text-foreground/80">Documents * (minimum: Shop photo)</span>
                    {STAGE3_DOCS.map(dt => {
                      const existing = s3Docs.find(d => d.type === dt.type);
                      return (
                        <div key={dt.type} className="rounded-xl bg-surface px-3 py-2.5 ring-1 ring-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground/80">{dt.label}</span>
                            {existing && (
                              <button
                                type="button"
                                onClick={() => removeDoc(3, dt.type)}
                                className="text-[10px] hover:underline"
                                style={{ color: "var(--error)" }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {existing ? (
                            <div
                              className="flex items-center gap-1.5 text-[10px] font-medium"
                              style={{ color: "var(--success)" }}
                            >
                              <MaterialSymbol name="check_circle" className="!text-xs" aria-hidden="true" />
                            Uploaded
                            </div>
                          ) : (
                            <ImageUpload
                              endpoint="imageUploader"
                              label={`Upload ${dt.label}`}
                              onUploadComplete={(url) => addDoc(3, dt.type as DocType, dt.label, url)}
                              className=""
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-foreground/80">Notes for the reviewer (optional)</span>
                    <textarea className="dm-textarea !min-h-[80px]" value={s3Notes} onChange={e => setS3Notes(e.target.value)}
                      placeholder="Any details that help verify your business — registration number, trading name, etc." />
                  </label>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={submitting} className="dm-btn dm-btn-primary disabled:opacity-60">
                      {submitting ? "Submitting…" : "Submit for review"}
                    </button>
                    <button type="button" onClick={() => setActiveForm(null)} className="dm-btn dm-btn-ghost dm-btn-sm">Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </StageBlock>
      </div>

      {/* ── Badge legend ─────────────────────────────────────── */}
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
                    <span
                      className="ml-2 text-[10px] font-semibold"
                      style={{ color: "var(--success)" }}
                    >
                      ✓ Earned
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product modal */}
      {showProductModal && (
        <ProductFormModal
          mode="add"
          shopId={shopId}
          itemType="product"
          onClose={() => setShowProductModal(false)}
          onSaved={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
}

// ── StageBlock sub-component ──────────────────────────────────────────────────
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
