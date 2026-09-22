export const AUTH_CHANGED_EVENT = "midora-auth-changed";

export type AuthChangedDetail = {
  /** When present, /me should use this Bearer token (post-login race fix). */
  accessToken?: string;
};

export function notifyAuthChanged(detail?: AuthChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthChangedDetail>(AUTH_CHANGED_EVENT, { detail: detail ?? {} }),
  );
}
