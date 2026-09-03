"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

type Props = {
  onConfirm: () => void;
  type: "whatsapp" | "message";
  children: (open: () => void) => React.ReactNode;
};

// Three short bullets is what people actually read before a Proceed click.
const TIPS = [
  "Verify the seller before paying",
  "Never send money upfront",
  "Report anything suspicious",
];

export default function TradeDisclaimer({ onConfirm, type, children }: Props) {
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
      className="z-modal fixed inset-0 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-safe-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
            <MaterialSymbol name="verified_user" className="!text-lg" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="trade-safe-title" className="text-sm font-semibold text-foreground">
              Trade safely on Midora
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              You&apos;re heading to {isWhatsApp ? "WhatsApp" : "in-app messages"} to
              contact the seller.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
          >
            <MaterialSymbol name="close" className="!text-base" />
          </button>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-foreground/80">
          {TIPS.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <MaterialSymbol name="check_circle" className="!text-sm shrink-0 text-accent" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="dm-btn dm-btn-ghost dm-btn-sm flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
            className={[
              "dm-btn dm-btn-sm flex-1 gap-1.5",
              isWhatsApp
                ? "text-white shadow-sm hover:brightness-95"
                : "dm-btn-primary",
            ].join(" ")}
            style={isWhatsApp ? { background: "#25D366" } : undefined}
          >
            {isWhatsApp ? (
              <>
                <WhatsAppIcon className="size-3.5" />
                Continue to WhatsApp
              </>
            ) : (
              "Continue to messages"
            )}
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
