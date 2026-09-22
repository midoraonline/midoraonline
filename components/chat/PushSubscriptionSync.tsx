"use client";

import { useEffect } from "react";
import { resyncPushSubscriptionIfGranted } from "@/lib/push";
import { useAppSession } from "@/lib/state";

/**
 * Re-attach an existing browser push subscription to the signed-in user.
 * Does not prompt; opt-in stays on the chat banner and account settings.
 */
export default function PushSubscriptionSync() {
  const session = useAppSession();
  const userId = session.user?.id;

  useEffect(() => {
    if (!session.isAuthenticated || !userId) return;
    void resyncPushSubscriptionIfGranted().catch(() => {
      /* permission not granted, or the API has no VAPID key yet */
    });
  }, [session.isAuthenticated, userId]);

  return null;
}
