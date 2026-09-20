/**
 * Fires `listing:impressed` exactly once per mount when the card has been
 * continuously >=50% visible for >=1000ms. Batched ingest is handled by
 * the analytics bus — this hook never talks to a dedicated impressions API.
 */

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_DWELL_MS = 1000;

export type ImpressionPool =
  | "organic"
  | "boosted"
  | "sponsored"
  | "super_boost"
  | "premium_store"
  | "fresh"
  | "exploration";

export type ImpressionTrackerOptions = {
  listingId: string | null | undefined;
  shopId?: string | null;
  pool?: ImpressionPool;
  position?: number;
  threshold?: number;
  dwellMs?: number;
  enabled?: boolean;
};

export function useImpressionTracker<T extends Element>({
  listingId,
  shopId,
  pool = "organic",
  position,
  threshold = DEFAULT_THRESHOLD,
  dwellMs = DEFAULT_DWELL_MS,
  enabled = true,
}: ImpressionTrackerOptions) {
  const ref = useRef<T | null>(null);
  const fired = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fired.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [listingId]);

  useEffect(() => {
    if (!enabled || !listingId || fired.current) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (fired.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            if (timeoutRef.current) continue;
            timeoutRef.current = setTimeout(() => {
              if (fired.current) return;
              fired.current = true;
              track("listing:impressed", {
                productId: listingId,
                shopId: shopId ?? undefined,
                pool,
                position,
              });
              observer.disconnect();
              timeoutRef.current = null;
            }, dwellMs);
          } else if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      },
      { threshold: [0, threshold, 1] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, listingId, shopId, pool, position, threshold, dwellMs]);

  return ref;
}
