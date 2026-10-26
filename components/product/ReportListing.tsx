"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/base";
import { apiListingEvents } from "@/lib/api";
import { track } from "@/lib/analytics";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import FormModal from "@/components/FormModal";

type Props = {
  productId: string;
  shopId?: string;
  category?: string;
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

export default function ReportListing({ productId, shopId, category }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const needsDetails = reason === "Other";
  const canSubmit = !!reason && (!needsDetails || details.trim().length >= 3);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    if (submitting) return;
    setOpen(false);
    setReason("");
    setDetails("");
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const request = apiListingEvents.reportProduct(productId, reason, details.trim() || undefined);
    toast.promise(request, {
      loading: "Sending report…",
      success: "Report submitted — our team will review it.",
      error: (err: unknown) => apiErrorMessage(err, "Couldn't submit report. Try again."),
    });
    try {
      await request;
      if (shopId) {
        // Map free-text reasons onto the enum the analytics schema expects.
        const reasonKey: "scam" | "inaccurate_info" | "prohibited_item" | "unresponsive" | "other" =
          /scam|fraud/i.test(reason)
            ? "scam"
            : /prohibited/i.test(reason)
              ? "prohibited_item"
              : /misleading|wrong/i.test(reason)
                ? "inaccurate_info"
                : "other";
        track("trust:report_submitted", {
          targetType: "product",
          targetId: productId,
          shopId,
          category,
          reason: reasonKey,
        });
      }
      close();
    } catch {
      /* sonner surfaced */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dm-focus inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-[color:var(--error)]"
      >
        <MaterialSymbol name="flag" className="!text-sm" aria-hidden="true" />
        Report
      </button>

      {open && (
        <FormModal
          title="Report listing"
          onClose={close}
          maxWidthClass="sm:max-w-sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || submitting}
                className="dm-btn dm-btn-primary"
                style={{ background: "var(--error)" }}
              >
                {submitting ? "Sending…" : "Submit report"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Why are you reporting this listing? Your report will be reviewed by
              our team.
            </p>
            <div className="space-y-1">
              {REPORT_REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    aria-pressed={selected}
                    className={
                      selected
                        ? "dm-pill dm-pill--error w-full justify-start px-3 py-2 text-left text-xs font-medium"
                        : "dm-pill w-full justify-start bg-surface-subtle px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:bg-foreground/[0.06]"
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {needsDetails ? (
              <div className="space-y-1">
                <label htmlFor="report-details" className="text-xs font-medium text-foreground">
                  Tell us what&apos;s wrong <span className="text-[color:var(--error)]">*</span>
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                  rows={3}
                  required
                  autoFocus
                  placeholder="Describe the problem"
                  className="dm-textarea text-sm"
                  aria-invalid={details.trim().length < 3}
                />
                <p className="text-[11px] text-muted">Required when you choose Other.</p>
              </div>
            ) : null}
          </div>
        </FormModal>
      )}
    </>
  );
}
