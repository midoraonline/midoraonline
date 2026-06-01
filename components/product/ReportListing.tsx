"use client";

import { useState } from "react";
import { apiListingEvents } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  productId: string;
};

const REPORT_REASONS = [
  "Fake or counterfeit item",
  "Scam or fraud",
  "Prohibited item",
  "Wrong category",
  "Spam or duplicate",
  "Misleading description",
  "Other",
];

export default function ReportListing({ productId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!reason) return;
    try {
      await apiListingEvents.recordListingEvent(productId, "reported");
      setSubmitted(true);
      setError(null);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setReason("");
      }, 2000);
    } catch {
      setError("Failed to submit report. Please try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dm-focus inline-flex items-center gap-1 text-[11px] text-muted hover:text-rose-500"
      >
        <MaterialSymbol name="flag" className="!text-sm" />
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="dm-card w-full max-w-sm space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold">Report Listing</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                <MaterialSymbol name="close" className="!text-lg" />
              </button>
            </div>

            {submitted ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
                <MaterialSymbol name="check_circle" className="!text-base" />
                Report submitted. Our team will review it.
              </div>
            ) : (
              <>
                <p className="text-xs text-muted">
                  Why are you reporting this listing? Your report will be reviewed by our team.
                </p>

                <div className="space-y-1">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        reason === r
                          ? "bg-rose-500/10 text-rose-600 font-medium"
                          : "bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.06]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-rose-500">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reason}
                  className="dm-pill dm-focus w-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50"
                >
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
