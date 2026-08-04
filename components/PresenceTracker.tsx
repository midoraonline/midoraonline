"use client";

import { useEffect, useMemo } from "react";
import { useAppSession } from "@/lib/state";
import { usePresenceCount } from "@/lib/realtime/hooks";
import { hydratePresenceFromCache, usePresenceStore } from "@/lib/state/presence-store";

const PRESENCE_CHANNEL = "midora:presence:global";

export default function PresenceTracker() {
  const session = useAppSession();

  useEffect(() => {
    hydratePresenceFromCache();
  }, []);

  const presenceState = useMemo(() => {
    if (session.isAuthenticated && session.user) {
      return {
        user_id: session.user.id,
        role: session.user.user_role ?? "customer",
        available: session.user.user_role === "merchant",
      };
    }
    return { role: "guest" as const };
  }, [session.isAuthenticated, session.user]);

  const count = usePresenceCount(PRESENCE_CHANNEL, presenceState, true);

  useEffect(() => {
    usePresenceStore.getState().setCount(count);
  }, [count]);

  return null;
}
