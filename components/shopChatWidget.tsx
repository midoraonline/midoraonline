"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ShopChat from "./shopChat";

export default function ShopChatWidget({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(100%,320px)] sm:w-[360px] overflow-hidden rounded-2xl border border-border bg-surface sm:rounded-3xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface/95">
            <div>
              <p className="text-xs font-semibold tracking-tight">
                {shopName} concierge
              </p>
              <p className="text-[11px] text-muted">
                Ask about products, availability &amp; policies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid size-7 place-items-center rounded-full text-muted hover:text-foreground hover:bg-primary/5 dm-focus transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="p-3">
            <ShopChat shopId={shopId} shopName={shopName} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95 dm-focus"
      >
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span>Ask {shopName}</span>
      </button>
    </div>
  );
}
