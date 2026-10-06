"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, X } from "lucide-react";

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
      className="mb-4 flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Get noticed</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Put your products, services and opportunities in front of local buyers.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/post-item" className="dm-btn dm-btn-primary min-h-10 px-3 text-xs">
          Post a listing
        </Link>
        <Link href="/open-shop" className="dm-btn dm-btn-secondary min-h-10 gap-1.5 px-3 text-xs">
          <Store className="size-3.5" aria-hidden />
          Create a shop
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