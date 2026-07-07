"use client";

import { useEffect } from "react";
import { sendPresencePing } from "@/lib/presence";

const HEARTBEAT_MS = 60_000;

/** Keeps this tab registered in online_presence via a stable instance ID. */
export default function PresenceHeartbeat() {
  useEffect(() => {
    void sendPresencePing();

    const interval = setInterval(() => {
      void sendPresencePing();
    }, HEARTBEAT_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void sendPresencePing();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
