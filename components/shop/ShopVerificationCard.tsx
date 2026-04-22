"use client";

import { useCallback, useEffect, useState } from "react";

import { apiShops } from "@/lib/api";
import type { Verification, VerificationStatus } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";
import { useRealtimeTable } from "@/lib/realtime/hooks";

const STATUS_COPY: Record<
  VerificationStatus,
  { label: string; tone: string; description: string }
> = {
  unverified: {
    label: "Not submitted",
    tone: "bg-foreground/[0.06] text-foreground/70",
    description:
      "Submit your shop for verification to earn a trust badge and unlock the public directory.",
  },
  pending: {
    label: "Pending review",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    description:
      "We’re reviewing your submission. You’ll get an email as soon as there’s a decision.",
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
      "Please review the notes below and resubmit when you’ve addressed the feedback.",
  },
};

export default function ShopVerificationCard({ shopId }: { shopId: string }) {
  const session = useAppSession();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const v = await apiShops.getVerification(shopId);
      setVerification(v);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const v = await apiShops.submitForVerification(shopId, {
        notes: notes.trim() || undefined,
      });
      setVerification(v);
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const status: VerificationStatus = verification?.status ?? "unverified";
  const copy = STATUS_COPY[status];
  const canSubmit = status === "unverified" || status === "rejected";

  return (
    <section className="dm-card p-6 sm:p-8 lg:p-10">
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

      {loading ? (
        <p className="mt-4 text-sm text-muted">Loading verification…</p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {verification?.notes ? (
        <p className="mt-4 rounded-2xl bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/80 ring-1 ring-foreground/[0.06]">
          <strong className="font-semibold">Reviewer notes:</strong> {verification.notes}
        </p>
      ) : null}

      {canSubmit ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground/80">
              Notes for the reviewer (optional)
            </span>
            <textarea
              className="dm-textarea !min-h-[90px] dm-focus"
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
