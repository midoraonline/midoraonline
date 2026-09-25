"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

type Props = {
  onConfirm: () => void;
  type: "whatsapp" | "message";
  /** Only meaningful for type="whatsapp" — shows a verified/unverified badge. */
  whatsappVerified?: boolean;
  children: (open: () => void) => React.ReactNode;
};

const TIPS = [
  "Verify the seller before paying",
  "Never send money upfront",
  "Report anything suspicious",
];

export default function TradeDisclaimer({ onConfirm, type, whatsappVerified, children }: Props) {
  const [open, setOpen] = useState(false);
  const isWhatsApp = type === "whatsapp";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.documentElement.classList.add("modal-open");
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const modal = (
    <div
      className="z-modal fixed inset-0 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-safe-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-lg md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/15 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h3 id="trade-safe-title" className="text-base font-semibold text-foreground">
            Trade safely on Midora
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="dm-focus grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <MaterialSymbol name="close" className="!text-lg" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          You&apos;re heading to {isWhatsApp ? "WhatsApp" : "in-app messages"} to contact the seller.
        </p>
        {isWhatsApp && whatsappVerified !== undefined ? (
          <p
            className={[
              "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              whatsappVerified
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-200",
            ].join(" ")}
          >
            <MaterialSymbol
              name={whatsappVerified ? "verified" : "info"}
              className="!text-sm"
            />
            {whatsappVerified
              ? "This WhatsApp number is verified"
              : "This WhatsApp number isn't verified yet"}
          </p>
        ) : null}

        <ul className="mt-4 space-y-2.5 text-sm leading-snug text-foreground">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5">
              <MaterialSymbol name="check_circle" className="!text-base mt-0.5 shrink-0 text-accent" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 md:flex-row-reverse">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
            className={
              isWhatsApp
                ? "dm-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition hover:bg-[#22c35e] active:scale-[0.98] md:flex-1"
                : "dm-btn dm-btn-primary min-h-11 w-full md:flex-1"
            }
          >
            {isWhatsApp ? (
              <>
                <WhatsAppIcon className="size-4 text-white" />
                Continue to WhatsApp
              </>
            ) : (
              "Continue to messages"
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="dm-focus inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold text-foreground transition hover:bg-foreground/[0.04] active:scale-[0.98] md:flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {children(() => setOpen(true))}
      {open && typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}
