"use client";

import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

const DISMISS_KEY = "midora:push:dismissed";

/**
 * Non-intrusive banner nudging the user to enable browser push notifications
 * for chat. Hides itself when:
 *   • push isn't supported
 *   • permission is already granted (and subscribed) or explicitly denied
 *   • the user has clicked "Not now" (per browser/session)
 */
export default function EnablePushBanner() {
  const { support, permission, subscribed, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (support !== "supported") return null;
  if (permission === "denied") return null;
  if (subscribed) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="mx-4 mt-3 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
        <MaterialSymbol name="notifications_active" className="!text-lg" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Get notified about new messages</p>
        <p className="mt-0.5 text-xs text-muted">
          We&apos;ll ping your browser when a seller replies — even when this
          tab is in the background.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleDismiss}
          className="dm-focus rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-foreground/[0.05]"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="dm-focus rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}
