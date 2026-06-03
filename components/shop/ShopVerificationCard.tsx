"use client";

import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Verification, VerificationStatus, DocumentUpload } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { useRealtimeTable } from "@/lib/realtime/hooks";
import { MaterialSymbol } from "@/components/MaterialSymbol";

const STATUS_COPY: Record<
  VerificationStatus,
  { label: string; tone: string; description: string }
> = {
  unverified: {
    label: "Not submitted",
    tone: "bg-foreground/[0.06] text-foreground/70",
    description:
      "Submit your shop for verification to earn a trust badge and unlock the public directory. You'll need to upload identification documents and provide contact details.",
  },
  pending: {
    label: "Pending review",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    description:
      "We're reviewing your submission. You'll get an email as soon as there's a decision.",
  },
  verified: {
    label: "Verified",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    description: "Your shop is verified and visible in the public directory.",
  },
  rejected: {
    label: "Changes requested",
    tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    description:
      "Please review the notes below and resubmit when you've addressed the feedback.",
  },
};

const DOCUMENT_TYPES: { type: DocumentUpload["type"]; label: string }[] = [
  { type: "national_id_front", label: "National ID (Front)" },
  { type: "national_id_back", label: "National ID (Back)" },
  { type: "selfie", label: "Selfie with ID" },
  { type: "business_cert", label: "Business Certificate (optional)" },
];

export default function ShopVerificationCard({ shopId }: { shopId: string }) {
  const session = useAppSession();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const v = await apiShops.getVerification(shopId);
      setVerification(v);
      if (v.submitted_phone) setPhone(v.submitted_phone);
      if (v.submitted_whatsapp) setWhatsapp(v.submitted_whatsapp);
      if (v.submitted_location) setLocation(v.submitted_location);
      if (v.submitted_docs) setDocuments(v.submitted_docs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setVerification(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load verification",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [shopId, session.isAuthenticated]);

  useEffect(() => {
    if (!session.hydrated) return;
    if (!session.isAuthenticated) {
      setLoading(false);
      return;
    }
    load();
  }, [load, session.hydrated, session.isAuthenticated]);

  useRealtimeTable(
    {
      table: "shop_verifications",
      channel: `shop-verification:${shopId}`,
      filter: `shop_id=eq.${shopId}`,
      enabled: !!shopId,
    },
    () => {
      void load();
    },
  );

  function addDocument(type: DocumentUpload["type"]) {
    const url = window.prompt(`Enter URL for ${DOCUMENT_TYPES.find(d => d.type === type)?.label}:`);
    if (url && url.trim()) {
      setDocuments(prev => [
        ...prev.filter(d => d.type !== type),
        { url: url.trim(), type, label: DOCUMENT_TYPES.find(d => d.type === type)?.label || type },
      ]);
    }
  }

  function removeDocument(type: string) {
    setDocuments(prev => prev.filter(d => d.type !== type));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const v = await apiShops.submitForVerification(shopId, {
        notes: notes.trim() || undefined,
        documents: documents.length > 0 ? documents : undefined,
        submitted_phone: phone.trim() || undefined,
        submitted_whatsapp: whatsapp.trim() || undefined,
        submitted_location: location.trim() || undefined,
      });
      setVerification(v);
      setActiveStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const status: VerificationStatus = verification?.status ?? "unverified";
  const copy = STATUS_COPY[status];
  const canSubmit = status === "unverified" || status === "rejected";
  const duration = verification?.shop_duration_days ?? 0;

  const steps = [
    { label: "Contact Info", done: !!(phone || whatsapp || location) },
    { label: "Documents", done: documents.length >= 2 },
    { label: "Notes", done: true },
  ];

  return (
    <section className="dm-card space-y-6 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Verification</h2>
          <p className="mt-1 text-sm text-muted">{copy.description}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${copy.tone}`}
        >
          {copy.label}
        </span>
      </div>

      {duration > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/80">
          <MaterialSymbol name="calendar_today" className="!text-sm" />
          Shop on platform for {duration} day{duration !== 1 ? "s" : ""}
        </div>
      )}

      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {verification?.notes ? (
        <p className="rounded-2xl bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/80 ring-1 ring-foreground/[0.06]">
          <strong className="font-semibold">Reviewer notes:</strong> {verification.notes}
        </p>
      ) : null}

      {canSubmit ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 text-xs">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    i === activeStep
                      ? "bg-primary/20 text-primary"
                      : step.done
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-foreground/[0.06] text-foreground/60"
                  }`}
                >
                  {step.done ? (
                    <MaterialSymbol name="check_circle" className="!text-xs" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                  {step.label}
                </span>
                {i < steps.length - 1 && <span className="text-foreground/20">—</span>}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground/80">Valid Phone Number *</span>
              <input
                type="tel"
                className="dm-input dm-focus w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256 7XX XXX XXX"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground/80">WhatsApp Number *</span>
              <input
                type="tel"
                className="dm-input dm-focus w-full"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+256 7XX XXX XXX"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground/80">Physical Location *</span>
              <input
                type="text"
                className="dm-input dm-focus w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shop 12, Nakawa Market, Kampala"
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-foreground/80">
              Upload Documents * (minimum: National ID front + back)
            </span>
            {DOCUMENT_TYPES.map((dt) => {
              const existing = documents.find(d => d.type === dt.type);
              return (
                <div key={dt.type} className="flex items-center justify-between rounded-xl bg-foreground/[0.03] px-3 py-2">
                  <span className="text-xs text-foreground/80">{dt.label}</span>
                  {existing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600">Uploaded</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(dt.type)}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addDocument(dt.type)}
                      className="text-[10px] font-medium text-accent hover:underline"
                    >
                      + Add URL
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground/80">
              Notes for the reviewer (optional)
            </span>
            <textarea
              className="dm-textarea !min-h-[80px] dm-focus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share anything that helps our team verify your shop."
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="dm-pill dm-focus bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? "Submitting…"
              : status === "rejected"
              ? "Resubmit for review"
              : "Submit for verification"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
