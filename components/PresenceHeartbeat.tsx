"use client";

import { useEffect } from "react";
import {
  sendPresenceActive,
  sendPresenceInactive,
  sendPresenceLeaveAndClear,
  sendPresencePing,
} from "@/lib/presence";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/token-storage";

const HEARTBEAT_MS = 60_000;

/**
 * Tracks tab lifecycle with native browser APIs:
 * - visibilitychange — inactive when hidden, active when visible
 * - pagehide — tab close / navigation away (sendBeacon cleanup)
 * - pageshow — restore from bfcache
 */
export default function PresenceHeartbeat() {
  useEffect(() => {
    void sendPresencePing(true);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendPresencePing();
      }
    }, HEARTBEAT_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendPresenceInactive();
      } else {
        sendPresenceActive();
      }
    }

    function onPageHide() {
      sendPresenceLeaveAndClear();
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        sendPresenceActive();
      }
    }

    function onAuthChanged() {
      if (document.visibilityState === "visible") {
        sendPresenceActive();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      if (document.visibilityState === "visible") {
        sendPresenceInactive();
      }
    };
  }, []);

  return null;
}
