/**
 * `useImpressionTracker` — fires an impression exactly once per mount when
 * the target element has been continuously >=50% visible for >=1000ms.
 *
 * Backed by IntersectionObserver so it's efficient even with hundreds of
 * simultaneously mounted cards. The impression is queued in-memory and
 * flushed to `/api/v1/feed/impressions` in batches by the module in
 * `lib/impressions.ts`.
 */

import { useEffect, useRef } from "react";

import { trackImpression, type ImpressionPool } from "@/lib/impressions";

const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_DWELL_MS = 1000;

export type ImpressionTrackerOptions = {
  listingId: string | null | undefined;
  pool?: ImpressionPool;
  position?: number;
  threshold?: number;
  dwellMs?: number;
  enabled?: boolean;
};

export function useImpressionTracker<T extends Element>({
  listingId,
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
              trackImpression({ listing_id: listingId, pool, position });
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
  }, [enabled, listingId, pool, position, threshold, dwellMs]);

  return ref;
}
