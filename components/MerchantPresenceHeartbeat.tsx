"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";

/**
 * Lightweight heartbeat for the FastAPI presence tracker so that
 * `shops.available_now` continues to reflect whether the merchant is
 * actively online. Only runs for authenticated merchants and only while
 * the tab is visible.
 *
 * The general "N users online" count is handled entirely by Supabase
 * Presence (see `usePresenceCount` in the navbar) — this component exists
 * solely to keep the merchant availability signal alive.
 */

const HEARTBEAT_MS = 5 * 60_000;
const STORAGE_KEY = "midora:merchant:instance";

function ensureInstanceId(): string {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = `midora-${crypto.randomUUID()}`;
    window.sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Session storage may be blocked (private mode); fall back to a
    // module-scoped id for the lifetime of the tab.
    return `midora-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function ping(instanceId: string): Promise<unknown> {
  return apiFetch("/api/v1/presence/ping", {
    method: "POST",
    body: { instance_id: instanceId },
  }).catch(() => undefined);
}

function leave(instanceId: string): void {
  // Best-effort; sendBeacon survives tab unload.
  try {
    const url = "/api/dev-proxy/api/v1/presence/leave";
    const blob = new Blob([JSON.stringify({ instance_id: instanceId })], {
      type: "application/json",
    });
    navigator.sendBeacon(url, blob);
  } catch {
    /* ignore */
  }
}

export default function MerchantPresenceHeartbeat(): null {
  const session = useAppSession();
  const isMerchant = session.user?.user_role === "merchant";

  useEffect(() => {
    if (!isMerchant) return;
    const instanceId = ensureInstanceId();

    const beat = () => {
      if (document.visibilityState === "visible") void ping(instanceId);
    };

    beat();
    const interval = window.setInterval(beat, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    const onPageHide = () => leave(instanceId);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [isMerchant]);

  return null;
}
