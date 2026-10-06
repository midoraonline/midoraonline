"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store, X } from "lucide-react";

const DISMISS_KEY = "midora:get-noticed-dismissed";

export default function GuestGetNoticedBanner({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!visible || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      return;
    }
  }

  return (
    <aside
      aria-label="Get noticed"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-accent/25 bg-accent/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Get noticed</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Sell or post an ad. It&apos;s free and takes about a minute.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/post-item" className="dm-btn dm-btn-primary min-h-11 gap-1.5 px-4 text-xs">
          <Plus className="size-4" aria-hidden />
          Sell or post an ad
        </Link>
        <Link href="/open-shop" className="dm-btn dm-btn-secondary min-h-11 gap-1.5 px-3 text-xs">
          <Store className="size-3.5" aria-hidden />
          Create an online shop
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Get noticed banner"
          className="dm-focus grid size-10 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}