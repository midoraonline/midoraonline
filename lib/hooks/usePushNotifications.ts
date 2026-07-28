"use client";

import { useCallback, useEffect, useState } from "react";
import {
  currentPushPermission,
  detectPushSupport,
  disablePushNotifications,
  enablePushNotifications,
  getCurrentPushSubscription,
  resyncPushSubscriptionIfGranted,
  type PushPermission,
  type PushSupport,
} from "@/lib/push";

export type PushState = {
  support: PushSupport;
  permission: PushPermission;
  subscribed: boolean;
  busy: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
};

/**
 * React hook exposing the current Web Push subscription state and the
 * enable/disable toggles. Safe to call server-side (returns `"unsupported"`).
 */
export function usePushNotifications(): PushState {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const s = detectPushSupport();
    setSupport(s);
    setPermission(currentPushPermission());
    if (s !== "supported") {
      setSubscribed(false);
      return;
    }
    const sub = await getCurrentPushSubscription();
    setSubscribed(!!sub);
    // Keep the DB row tied to the current session (login / account switch).
    if (sub && currentPushPermission() === "granted") {
      try {
        await resyncPushSubscriptionIfGranted();
      } catch {
        /* best-effort — user may not be logged in yet */
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (busy) return false;
    setBusy(true);
    try {
      const sub = await enablePushNotifications();
      setSubscribed(!!sub);
      setPermission(currentPushPermission());
      return !!sub;
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await disablePushNotifications();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { support, permission, subscribed, busy, enable, disable, refresh };
}
