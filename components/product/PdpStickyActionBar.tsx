"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function PdpStickyActionBar({
  sentinelId,
  children,
}: {
  sentinelId: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(sentinelId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelId]);

  return (
    <div
      className={[
        "z-sticky fixed inset-x-3 bottom-3 sm:hidden",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div className="dm-glass-bar flex items-center gap-3 p-2">{children}</div>
    </div>
  );
}
