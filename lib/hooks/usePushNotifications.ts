"use client";

import { useCallback, useEffect, useState } from "react";
import {
  currentPushPermission,
  detectPushSupport,
  disablePushNotifications,
  enablePushNotifications,
  getCurrentPushSubscription,
  type PushPermission,
  type PushSupport,
} from "@/lib/push";

export type PushState = {
  support: PushSupport;
  permission: PushPermission;
  subscribed: boolean;
  busy: boolean;
  enable: () => Promise<void>;
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
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const sub = await enablePushNotifications();
      setSubscribed(!!sub);
      setPermission(currentPushPermission());
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
