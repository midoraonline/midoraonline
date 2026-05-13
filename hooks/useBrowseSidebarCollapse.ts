"use client";

import { useEffect, useState } from "react";

/** Collapsed on small screens by default; expanded from `lg` up (same as home browse). */
export function useBrowseSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setCollapsed(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return { collapsed, setCollapsed };
}
