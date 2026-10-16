/**
 * After a boost/repost/end-boost the cached feed order is stale. The API drops its
 * caches; this marks the browser side so the next feed load skips the edge cache
 * (unique `fv` param) and an open feed reloads page 1 when the user returns to it.
 */
const KEY = "midora:feed-stale-at";
const WINDOW_MS = 10 * 60_000;
export const FEED_STALE_EVENT = "midora:feed-stale";

export function markFeedStale(): void {
  if (typeof window === "undefined") return;
  const now = String(Date.now());
  try {
    window.localStorage.setItem(KEY, now);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(FEED_STALE_EVENT));
}

export function feedStaleAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Cache-busting value for feed requests while a recent change may still be edge-cached. */
export function feedBustParam(): string | null {
  const at = feedStaleAt();
  return at && Date.now() - at < WINDOW_MS ? String(at) : null;
}

const CONSUMED = "midora:feed-stale-consumed";

/** Marker value this tab's feed already reloaded for. First visit counts as consumed. */
export function consumedFeedStaleAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(CONSUMED);
    if (raw === null) {
      // Fresh tab: SSR already fetched the current order (with fv busting edge cache).
      window.sessionStorage.setItem(CONSUMED, String(feedStaleAt()));
      return feedStaleAt();
    }
    return Number(raw) || 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function consumeFeedStale(at: number): void {
  try {
    window.sessionStorage.setItem(CONSUMED, String(at));
  } catch {
    /* ignore */
  }
}
