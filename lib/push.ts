"use client";

/**
 * Web Push subscription helpers.
 *
 * The VAPID public key is served by the FastAPI backend at
 * `/api/v1/push/public-key` (also mirrored via NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * so the initial subscribe attempt doesn't need a round-trip).
 *
 * `applicationServerKey` must be URL-safe base64 of the uncompressed P-256
 * public point — not PEM. PEM values in NEXT_PUBLIC_ are ignored so we fall
 * back to the API (which normalizes PEM → applicationServerKey).
 */

import { apiFetch } from "@/lib/api/base";

export type PushSupport = "supported" | "insecure-context" | "unsupported";

export type PushPermission = NotificationPermission | "unsupported";

const SW_URL = "/sw.js";

/** Detect whether Web Push can work in this environment. */
export function detectPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";
  if (!("PushManager" in window)) return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  // Web Push requires a secure context.
  if (!window.isSecureContext) return "insecure-context";
  return "supported";
}

export function currentPushPermission(): PushPermission {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function isApplicationServerKey(value: string): boolean {
  const v = value.trim();
  if (!v || v.includes("BEGIN")) return false;
  // Uncompressed P-256 point is 65 bytes → ~87 chars URL-safe base64 (no pad).
  return /^[A-Za-z0-9_-]{80,100}$/.test(v);
}

async function fetchServerPublicKey(): Promise<string> {
  const inlined = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (inlined && isApplicationServerKey(inlined)) return inlined;
  const res = await apiFetch<{ public_key: string }>("/api/v1/push/public-key");
  const key = (res.public_key || "").trim();
  return isApplicationServerKey(key) ? key : "";
}

/** VAPID keys are URL-safe base64; convert to the Uint8Array PushManager wants. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  // Prefer scope-based lookup — getRegistration(scriptURL) is unreliable.
  const existing =
    (await navigator.serviceWorker.getRegistration("/")) ||
    (await navigator.serviceWorker.getRegistration());
  if (existing?.active || existing?.waiting || existing?.installing) {
    const scriptURL =
      existing.active?.scriptURL ||
      existing.waiting?.scriptURL ||
      existing.installing?.scriptURL ||
      "";
    if (scriptURL.endsWith(SW_URL) || scriptURL.includes(SW_URL)) {
      return existing;
    }
  }
  return navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (detectPushSupport() !== "supported") return null;
  const reg =
    (await navigator.serviceWorker.getRegistration("/")) ||
    (await navigator.serviceWorker.getRegistration());
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/**
 * If the browser already has a push subscription (permission granted),
 * re-POST it so the current logged-in user owns the DB row.
 */
export async function resyncPushSubscriptionIfGranted(): Promise<boolean> {
  if (detectPushSupport() !== "supported") return false;
  if (currentPushPermission() !== "granted") return false;
  const sub = await getCurrentPushSubscription();
  if (!sub) return false;
  await syncSubscriptionToServer(sub);
  return true;
}

/**
 * Request notification permission (if needed), register the service worker,
 * subscribe to Push, and persist the subscription server-side.
 * Returns the created `PushSubscription` or `null` on failure / denial.
 */
export async function enablePushNotifications(): Promise<PushSubscription | null> {
  if (detectPushSupport() !== "supported") return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const publicKey = await fetchServerPublicKey();
  if (!publicKey) {
    // VAPID keys not configured server-side yet (or still PEM-only without API).
    console.error(
      "[push] No valid VAPID applicationServerKey. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY " +
        "to URL-safe base64, or VAPID_PUBLIC_KEY on the API (PEM is auto-converted).",
    );
    return null;
  }

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  // Drop any prior subscription. Subscriptions created with a PEM / wrong
  // applicationServerKey are bound to a key the server cannot sign for —
  // reusing them silently breaks delivery after a VAPID format fix.
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    const oldEndpoint = existing.endpoint;
    try {
      await existing.unsubscribe();
    } catch {
      /* continue to subscribe */
    }
    try {
      await apiFetch("/api/v1/push/unsubscribe", {
        method: "POST",
        body: { endpoint: oldEndpoint },
      });
    } catch {
      /* best-effort */
    }
  }

  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // TS DOM types insist on `BufferSource`; the underlying buffer is fine
      // regardless. Cast keeps us honest without a runtime copy.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });
  } catch (err) {
    console.error("[push] PushManager.subscribe failed", err);
    return null;
  }

  await syncSubscriptionToServer(sub);
  return sub;
}

async function syncSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await apiFetch("/api/v1/push/subscribe", {
    method: "POST",
    body: {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    },
  });
}

export async function disablePushNotifications(): Promise<void> {
  const sub = await getCurrentPushSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // Non-fatal — we still want to tell the server to forget the subscription.
  }
  try {
    await apiFetch("/api/v1/push/unsubscribe", {
      method: "POST",
      body: { endpoint },
    });
  } catch {
    /* best-effort */
  }
}

/** Send a test push to yourself. Useful for the settings screen. */
export function sendTestPush(): Promise<{ delivered: number; reason?: string }> {
  return apiFetch<{ delivered: number; reason?: string }>("/api/v1/push/test", {
    method: "POST",
    body: "{}",
  });
}
