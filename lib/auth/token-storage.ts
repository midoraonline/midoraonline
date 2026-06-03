export const AUTH_CHANGED_EVENT = "midora-auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
