"use client";

/**
 * Web Push subscription helpers.
 *
 * The VAPID public key is served by the FastAPI backend at
 * `/api/v1/push/public-key` (also mirrored via NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * so the initial subscribe attempt doesn't need a round-trip).
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

async function fetchServerPublicKey(): Promise<string> {
  const inlined = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (inlined) return inlined;
  const res = await apiFetch<{ public_key: string }>("/api/v1/push/public-key");
  return (res.public_key || "").trim();
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
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (detectPushSupport() !== "supported") return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  if (!reg) return null;
  return reg.pushManager.getSubscription();
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
    // VAPID keys not configured server-side yet.
    return null;
  }

  const reg = await registerServiceWorker();
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await syncSubscriptionToServer(existing);
    return existing;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // TS DOM types insist on `BufferSource`; the underlying buffer is fine
    // regardless. Cast keeps us honest without a runtime copy.
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
  });

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
export function sendTestPush(): Promise<{ delivered: number }> {
  return apiFetch<{ delivered: number }>("/api/v1/push/test", {
    method: "POST",
    body: "{}",
  });
}
