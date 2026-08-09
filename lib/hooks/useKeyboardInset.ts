"use client";

import { useEffect } from "react";

/**
 * Track the on-screen keyboard's overlap of the visual viewport and expose it
 * as a CSS custom property (default `--kb-inset`) on `<html>`.
 *
 * Why: iOS Safari and Chrome-on-iOS resize only the *visual* viewport when the
 * keyboard opens, so `100dvh` layouts don't reflow and a `bottom-0` composer
 * gets covered. This hook uses the `visualViewport` API (Baseline widely
 * available) to compute the overlap in CSS pixels; Android Chrome (which
 * resizes the layout viewport when `interactive-widget=resizes-content` is
 * set on the viewport meta) will emit 0px.
 *
 * Consumers style with e.g. `paddingBottom: "var(--kb-inset, 0px)"` or a
 * matching Tailwind arbitrary value.
 */
export function useKeyboardInset(cssVar: string = "--kb-inset"): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const update = () => {
      // Overlap = layout viewport height − (visual viewport bottom).
      // `window.innerHeight` tracks the layout viewport (which does *not*
      // shrink on iOS when the keyboard opens); `vv.height + vv.offsetTop`
      // is the bottom edge of the visible area.
      const overlap = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      root.style.setProperty(cssVar, `${Math.round(overlap)}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      root.style.removeProperty(cssVar);
    };
  }, [cssVar]);
}
