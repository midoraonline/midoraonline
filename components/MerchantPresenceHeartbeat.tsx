"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/base";
import { useAppSession } from "@/lib/state";


const HEARTBEAT_MS = 60_000;
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
  const userId = session.user?.id ?? null;
  const instanceIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const instanceId = instanceIdRef.current ?? ensureInstanceId();
    instanceIdRef.current = instanceId;

    const beat = () => {
      if (document.visibilityState === "visible") void ping(instanceId);
    };

    beat();
    const interval = window.setInterval(beat, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
      else leave(instanceId);
    };
    const onPageHide = () => leave(instanceId);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      // Unmount cleanup only; auth transitions are handled in a separate effect
      // to avoid race conditions during sign-in.
      leave(instanceId);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    const instanceId = instanceIdRef.current ?? ensureInstanceId();
    instanceIdRef.current = instanceId;

    const prevUserId = prevUserIdRef.current;
    const loggedOut = !!prevUserId && !userId;
    if (loggedOut) {
      leave(instanceId);
    }

    // Always re-ping on auth identity changes so this tab's instance is
    // immediately re-linked (or detached) server-side.
    if (document.visibilityState === "visible") {
      void ping(instanceId);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  return null;
}
