import { clearAppInstanceId, getAppInstanceId, isValidAppInstanceId } from "@/lib/appInstanceId";
import { pingPresence } from "@/lib/api/stats";
import { resolveClientApiUrl } from "@/lib/api/base";

let lastPingAt = 0;
const MIN_PING_INTERVAL_MS = 30_000;

function presencePayload(instanceId: string): string {
  return JSON.stringify({ instance_id: instanceId });
}

/**
 * Best-effort leave call for tab close / unload.
 * Uses navigator.sendBeacon (native) with fetch keepalive fallback.
 */
export function sendPresenceLeave(): void {
  if (typeof window === "undefined") return;

  const instanceId = getAppInstanceId();
  if (!isValidAppInstanceId(instanceId)) return;

  const url = resolveClientApiUrl("/api/v1/presence/leave");
  const body = presencePayload(instanceId);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}

/** Leave + wipe local instance id (tab is actually unloading). */
export function sendPresenceLeaveAndClear(): void {
  sendPresenceLeave();
  clearAppInstanceId();
}

/** Register this tab as online. Auth cookies attach user_id on the server. */
export async function sendPresencePing(force = false): Promise<void> {
  if (typeof window === "undefined") return;

  const instanceId = getAppInstanceId();
  if (!isValidAppInstanceId(instanceId)) return;

  const now = Date.now();
  if (!force && now - lastPingAt < MIN_PING_INTERVAL_MS) return;
  lastPingAt = now;

  try {
    await pingPresence(instanceId);
  } catch {
    /* best-effort */
  }
}

/** Tab became hidden — mark inactive on server (keep local id for resume). */
export function sendPresenceInactive(): void {
  sendPresenceLeave();
}

/** Tab visible again — re-register presence. */
export function sendPresenceActive(): void {
  lastPingAt = 0;
  void sendPresencePing(true);
}
