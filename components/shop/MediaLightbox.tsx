"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isVideoUrl } from "@/lib/api/products";

/** Full-screen viewer for uploaded media: fit to screen, arrows / swipe / keys, close. */
export default function MediaLightbox({
  urls,
  index,
  onIndexChange,
  onClose,
  footer,
}: {
  urls: string[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  /** Per-photo controls (rendered under the image). */
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const url = urls[index];
  const count = urls.length;
  const go = (d: number) => {
    if (count > 1) onIndexChange((index + d + count) % count);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs the DOM
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) onIndexChange((index - 1 + count) % count);
      else if (e.key === "ArrowRight" && count > 1) onIndexChange((index + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onClose, onIndexChange]);

  if (!mounted || !url) return null;
  const video = isVideoUrl(url);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${video ? "Video" : "Photo"} ${index + 1} of ${count}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <span className="text-sm tabular-nums text-white/80">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="dm-focus flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s || s.id !== e.pointerId) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
        }}
      >
        {video ? (
          <video key={url} src={url} controls playsInline className="max-h-full max-w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- full-resolution CDN URL
          <img key={url} src={url} alt="" draggable={false} className="max-h-full max-w-full select-none object-contain" />
        )}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="dm-focus absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="dm-focus absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
      {footer ? (
        <div className="px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2">{footer}</div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
