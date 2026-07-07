import { getAppInstanceId, isValidAppInstanceId } from "@/lib/appInstanceId";
import { pingPresence } from "@/lib/api/stats";

let lastPingAt = 0;
const MIN_PING_INTERVAL_MS = 30_000;

/** Register this tab as online (throttled). Safe to call often. */
export async function sendPresencePing(): Promise<void> {
  if (typeof window === "undefined") return;

  const instanceId = getAppInstanceId();
  if (!isValidAppInstanceId(instanceId)) return;

  const now = Date.now();
  if (now - lastPingAt < MIN_PING_INTERVAL_MS) return;
  lastPingAt = now;

  try {
    await pingPresence(instanceId);
  } catch {
    /* best-effort */
  }
}
