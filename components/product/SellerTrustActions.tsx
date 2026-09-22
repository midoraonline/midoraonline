"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiListingEvents } from "@/lib/api";
import { SELLER_REPORT_REASONS } from "@/lib/api/listingEvents";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import FormModal from "@/components/FormModal";

type Props = {
  sellerId: string;
  shopId?: string;
  shopName?: string;
};

export default function SellerTrustActions({ sellerId, shopId, shopName }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);

  function closeReport() {
    if (busy) return;
    setReportOpen(false);
    setReason("");
  }

  async function submitReport() {
    if (!reason) return;
    setBusy(true);
    const req = apiListingEvents.reportSeller(sellerId, reason, { shopId });
    toast.promise(req, {
      loading: "Sending report…",
      success: "Seller report submitted — our team will review it.",
      error: "Couldn't submit report. Try again.",
    });
    try {
      await req;
      closeReport();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function toggleBlock() {
    setBusy(true);
    try {
      if (blocked) {
        await apiListingEvents.unblockSeller(sellerId);
        setBlocked(false);
        toast.success("Seller unblocked");
      } else {
        await apiListingEvents.blockSeller(sellerId);
        setBlocked(true);
        toast.success(
          shopName
            ? `${shopName} is blocked for you.`
            : "Seller blocked",
        );
      }
    } catch {
      toast.error("Couldn't update block. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="dm-focus inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-[color:var(--error)]"
        >
          <MaterialSymbol name="flag" className="!text-sm" aria-hidden="true" />
          Report seller
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleBlock()}
          className="dm-focus inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-foreground"
        >
          <MaterialSymbol
            name={blocked ? "lock_open" : "block"}
            className="!text-sm"
            aria-hidden="true"
          />
          {blocked ? "Unblock seller" : "Block seller"}
        </button>
      </div>

      {reportOpen ? (
        <FormModal
          title="Report seller"
          onClose={closeReport}
          maxWidthClass="sm:max-w-sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeReport}
                disabled={busy}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitReport()}
                disabled={!reason || busy}
                className="dm-btn dm-btn-primary"
                style={{ background: "var(--error)" }}
              >
                {busy ? "Sending…" : "Submit report"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Why are you reporting{" "}
              {shopName ? <strong className="text-foreground">{shopName}</strong> : "this seller"}?
              Your report helps keep Midora safe.
            </p>
            <div className="space-y-1">
              {SELLER_REPORT_REASONS.map((r) => {
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
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
