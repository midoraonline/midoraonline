"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { previousRoute } from "@/lib/returnTo";

/**
 * Keeps a flow's current step in the URL (`?<key>=`), so the browser back
 * button moves between steps too. `go` pushes a history entry; `back` pops
 * one when we pushed it, otherwise replaces the URL with the earlier step.
 */
export function useUrlStep(key = "step") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key);
  const depth = useRef(0);
  const expected = useRef<string | null>(value);

  // Browser back/forward: keep our own push count roughly in step.
  useEffect(() => {
    if (value === expected.current) return;
    depth.current = Math.max(0, depth.current - 1);
    expected.current = value;
  }, [value]);

  const urlFor = useCallback(
    (next: string | null, extra?: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === null) params.delete(key);
      else params.set(key, next);
      for (const [k, v] of Object.entries(extra ?? {})) {
        if (v === null) params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [key, pathname, searchParams],
  );

  const go = useCallback(
    (next: string, opts?: { replace?: boolean; extra?: Record<string, string | null> }) => {
      expected.current = next;
      const url = urlFor(next, opts?.extra);
      if (opts?.replace) router.replace(url, { scroll: false });
      else {
        depth.current += 1;
        router.push(url, { scroll: false });
      }
    },
    [router, urlFor],
  );

  /** Step back to `prev` (a step value) within the flow. */
  const back = useCallback(
    (prev: string) => {
      expected.current = prev;
      if (depth.current > 0) {
        depth.current -= 1;
        router.back();
      } else {
        router.replace(urlFor(prev), { scroll: false });
      }
    },
    [router, urlFor],
  );

  return { value, go, back };
}

/** Leave a flow from its first step: the remembered previous route, else home. */
export function leaveFlow(router: { push: (href: string) => void }) {
  router.push(previousRoute() ?? "/");
}
