/**
 * Auth is now cookie-based (Phase 3). Tokens are delivered in httpOnly cookies
 * by the FastAPI backend and never touched by JavaScript.
 *
 * This module is kept as the single place that fires the client-side
 * "auth changed" event so `AppStateProvider` can re-hydrate from `/auth/me`
 * whenever a user signs in, refreshes, or signs out.
 */

export const AUTH_CHANGED_EVENT = "midora-auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
