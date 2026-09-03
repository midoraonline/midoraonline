
import { apiFetch } from "@/lib/api/base";

const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH_SIZE = 100;
const SESSION_STORAGE_KEY = "midora_session_id";

export type ImpressionPool =
  | "organic"
  | "boosted"
  | "sponsored"
  | "super_boost"
  | "premium_store"
  | "fresh"
  | "exploration";

export type ImpressionRecord = {
  listing_id: string;
  pool?: ImpressionPool;
  position?: number;
};

type QueueEntry = ImpressionRecord & { queuedAt: number };

let queue: QueueEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let unloadWired = false;

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushImpressions();
  }, FLUSH_INTERVAL_MS);
}

export function trackImpression(record: ImpressionRecord): void {
  if (typeof window === "undefined") return;
  if (!record.listing_id) return;

  const existing = queue.find((q) => q.listing_id === record.listing_id);
  if (existing) return; // already queued this cycle

  queue.push({ ...record, queuedAt: Date.now() });

  if (!unloadWired) {
    unloadWired = true;
    window.addEventListener("pagehide", () => void flushImpressions(true));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flushImpressions(true);
    });
  }

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushImpressions();
  } else {
    scheduleFlush();
  }
}

export async function flushImpressions(useBeacon = false): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.slice(0, MAX_BATCH_SIZE);
  queue = queue.slice(batch.length);

  const payload = {
    items: batch.map(({ listing_id, pool, position }) => ({
      listing_id,
      pool,
      position,
    })),
    session_id: getSessionId(),
  };

  // Best-effort: pagehide uses sendBeacon so the request survives navigation
  if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
      const url = `${base}/api/v1/feed/impressions`;
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch {

    }
  }

  try {
    await apiFetch<{ recorded: number }>("/api/v1/feed/impressions", {
      method: "POST",
      body: payload,
      headers: { "X-Midora-Session": getSessionId() },
    });
  } catch {

  }
}
