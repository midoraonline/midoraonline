"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import MidoraInfoChat from "./midoraInfoChat";

export default function MidoraInfoChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[320px] sm:w-[360px] shadow-xl rounded-3xl overflow-hidden bg-background border border-border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-surface/95">
            <div>
              <p className="text-xs font-semibold tracking-tight">
                Midora Online info bot
              </p>
              <p className="text-[11px] text-muted">
                Ask about the platform & product.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-foreground dm-focus rounded-full px-2 py-1"
            >
              Close
            </button>
          </div>
          <div className="p-3">
            <MidoraInfoChat />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold shadow-lg dm-focus"
      >
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span>Ask Midora Online</span>
      </button>
    </div>
  );
}

