/**
 * Stable unique ID per browser tab / app instance.
 *
 * Stored in sessionStorage so each tab has its own ID. The server row is
 * removed via `sendPresenceLeave()` on tab hide/close (sessionStorage alone
 * does not notify the API when a tab is discarded).
 */

const STORAGE_KEY = "midora:app-instance-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `midora-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Returns a stable instance tag for this tab, or "" during SSR. */
export function getAppInstanceId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && isValidAppInstanceId(existing)) {
      return existing;
    }
    const id = createId();
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return createId();
  }
}

export function clearAppInstanceId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isValidAppInstanceId(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 64) return false;
  return UUID_RE.test(trimmed) || trimmed.startsWith("midora-");
}
