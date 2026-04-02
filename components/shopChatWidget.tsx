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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[320px] sm:w-[360px] shadow-2xl rounded-3xl overflow-hidden bg-background border border-border">
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
              className="grid size-7 place-items-center rounded-full text-muted hover:text-foreground hover:bg-foreground/5 dm-focus transition-colors"
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
        className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg dm-focus hover:opacity-95 transition-opacity"
      >
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span>Ask {shopName}</span>
      </button>
    </div>
  );
}
