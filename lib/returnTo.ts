"use client";

/** Remembers the previous in-app route so "Leave" links can send users back. */
const PREV_KEY = "midora:prevRoute";
const CUR_KEY = "midora:curRoute";

export function recordRoute(route: string) {
  if (typeof window === "undefined") return;
  try {
    const cur = sessionStorage.getItem(CUR_KEY);
    if (cur === route) return;
    if (cur) sessionStorage.setItem(PREV_KEY, cur);
    sessionStorage.setItem(CUR_KEY, route);
  } catch {
    /* storage unavailable */
  }
}

/** Previous route, ignoring the current page and auth pages. */
export function previousRoute(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const prev = sessionStorage.getItem(PREV_KEY);
    const here = window.location.pathname + window.location.search;
    if (!prev || !prev.startsWith("/") || prev === here) return null;
    if (/^\/(login|register|auth\/)/.test(prev)) return null;
    return prev;
  } catch {
    return null;
  }
}
