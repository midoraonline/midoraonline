/**
 * Per-browser session id, cached in sessionStorage.
 *
 * Used to join events into a single "visit" for funnel metrics like
 * search-to-contact rate. Cleared when the browser tab is closed.
 */
const SESSION_KEY = 'midora.analytics.session_id';

let cached: string | null = null;

export function getAnalyticsSessionId(): string {
  if (cached) return cached;
  if (typeof window === 'undefined') {
    // Server-render fallback — the ID gets replaced on client bootstrap.
    return 'server';
  }
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    cached = fresh;
    return fresh;
  } catch {
    // Private-mode / disabled storage — use an in-memory value for this page.
    if (!cached) cached = crypto.randomUUID();
    return cached;
  }
}
