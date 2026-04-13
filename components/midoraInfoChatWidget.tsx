"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import MidoraInfoChat from "./midoraInfoChat";

export default function MidoraInfoChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(100%,320px)] sm:w-[360px] overflow-hidden rounded-2xl border border-border bg-surface sm:rounded-3xl">
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
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground dm-focus hover:opacity-95"
      >
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span>Ask Midora Online</span>
      </button>
    </div>
  );
}

