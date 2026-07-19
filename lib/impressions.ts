/**
 * Client-side impression batcher.
 *
 * Buffers viewport-visible listing IDs and flushes them to the API in
 * batches so we don't fire one XHR per card. Also assigns/persists an
 * anonymous session id used for fatigue tracking of logged-out visitors.
 *
 * Serverless-friendly by design: the server treats this endpoint as an
 * append-only sink and applies a 10-minute cooldown to prevent duplicate
 * rows from a busy viewport.
 */

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

/**
 * Stable anonymous session id, persisted in sessionStorage so it survives
 * navigation but resets when the tab closes.
 */
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

/**
 * Fire-and-forget: enqueue an impression to be flushed with the next batch.
 * Deduplicates by listing_id within the current queue.
 */
export function trackImpression(record: ImpressionRecord): void {
  if (typeof window === "undefined") return;
  if (!record.listing_id) return;

  const existing = queue.find((q) => q.listing_id === record.listing_id);
  if (existing) return; // already queued this cycle

  queue.push({ ...record, queuedAt: Date.now() });

  if (!unloadWired) {
    unloadWired = true;
    // Flush pending on tab close / navigation so we don't lose the tail.
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

/**
 * Flush all queued impressions. Called automatically on timer / batch size
 * / page unload. Also exported so callers can force-flush before a
 * navigation that unmounts the tracked components.
 */
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
      /* fall through to fetch */
    }
  }

  try {
    await apiFetch<{ recorded: number }>("/api/v1/feed/impressions", {
      method: "POST",
      body: payload,
      headers: { "X-Midora-Session": getSessionId() },
    });
  } catch {
    // Silent — impressions are best-effort. Losing a batch degrades the
    // exposure multiplier but never breaks the UX.
  }
}
