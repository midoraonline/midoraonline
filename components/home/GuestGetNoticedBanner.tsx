"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, Store, X } from "lucide-react";

const DISMISS_KEY = "midora:get-noticed-dismissed";
const DISMISS_EVENT = "midora:get-noticed-dismissed-change";
let dismissedInMemory = false;

function subscribeDismissal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DISMISS_EVENT, onChange);
  };
}

function getDismissedSnapshot() {
  if (dismissedInMemory) return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerDismissedSnapshot() {
  return false;
}

export default function GuestGetNoticedBanner({ visible }: { visible: boolean }) {
  const dismissed = useSyncExternalStore(
    subscribeDismissal,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );

  if (!visible || dismissed) return null;

  function dismiss() {
    dismissedInMemory = true;
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch { /* in-memory dismissal still applies */ }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <aside
      aria-label="Get noticed"
      className="relative mb-3 flex flex-col gap-2 rounded-lg border border-accent/25 bg-accent/5 p-2.5 pr-11 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3.5 sm:py-2.5 sm:pr-11"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">Get noticed</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          Post a listing for free in about a minute.
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <Link href="/post-item" className="dm-btn dm-btn-primary min-h-9 min-w-0 flex-1 gap-1 px-2.5 text-[11px] whitespace-nowrap sm:flex-initial sm:px-3 sm:text-xs">
          <Plus className="size-3.5 shrink-0" aria-hidden />
          Post listing
        </Link>
        <Link href="/open-shop" className="dm-btn dm-btn-secondary min-h-9 min-w-0 flex-1 gap-1 px-2.5 text-[11px] whitespace-nowrap sm:flex-initial sm:px-3 sm:text-xs">
          <Store className="size-3 shrink-0" aria-hidden />
          Open shop
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Get noticed banner"
          className="dm-focus absolute right-1 top-1 grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </aside>
  );
}