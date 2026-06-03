"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  onConfirm: () => void;
  type: "whatsapp" | "message";
  children: (open: () => void) => React.ReactNode;
};

export default function TradeDisclaimer({ onConfirm, type, children }: Props) {
  const [open, setOpen] = useState(false);

  const icon = type === "whatsapp" ? "chat" : "forum";
  const channel = type === "whatsapp" ? "WhatsApp" : "messages";

  return (
    <>
      {children(() => setOpen(true))}

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
              <div className="flex items-center gap-2">
                <MaterialSymbol name="warning" className="!text-xl text-amber-500" />
                <h3 className="text-sm font-semibold">Trade Safely</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                <MaterialSymbol name="close" className="!text-lg" />
              </button>
            </div>

            <div className="space-y-3 rounded-xl bg-amber-500/10 px-3 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <MaterialSymbol name="info" className="!text-base shrink-0 mt-0.5" />
                <span>
                  <strong>Verify the seller</strong> — Check their shop profile, ratings, and how long they have been on Midora before making payments.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MaterialSymbol name="info" className="!text-base shrink-0 mt-0.5" />
                <span>
                  <strong>Keep conversations on Midora</strong> — Use the in-app {channel} so we can help if something goes wrong.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MaterialSymbol name="info" className="!text-base shrink-0 mt-0.5" />
                <span>
                  <strong>Never pay before receiving</strong> — Avoid upfront payments. Scammers often ask for deposits or full payment before delivery.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MaterialSymbol name="info" className="!text-base shrink-0 mt-0.5" />
                <span>
                  <strong>Report suspicious behaviour</strong> — If something feels off, report the listing immediately. Your safety is our priority.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              By proceeding, you acknowledge these safety guidelines. Midora is not responsible for transactions conducted outside our platform.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="dm-pill dm-focus flex-1 border border-foreground/[0.12] px-4 py-2 text-xs font-semibold hover:bg-foreground/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className="dm-pill dm-focus flex-1 bg-accent px-4 py-2 text-xs font-semibold text-white hover:brightness-95"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <MaterialSymbol name={icon} className="!text-sm" />
                  Proceed to {channel}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
