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
    <div className="fab-above-bottom-nav z-fab fixed right-6 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(100%,320px)] origin-bottom-right overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-[360px] sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-border/60 bg-surface/95 px-4 py-3">
            <div>
              <p className="text-xs font-semibold tracking-tight">
                Ask {shopName}
              </p>
              <p className="text-[11px] text-muted">
                AI shop assistant
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
        aria-expanded={open}
        className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-95 dm-focus"
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span className="truncate">Ask {shopName}</span>
      </button>
    </div>
  );
}
