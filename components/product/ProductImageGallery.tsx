"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { isVideoUrl } from "@/lib/api/products";

function userMediaUnoptimized(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

function isVideoSrc(src: string) {
  return isVideoUrl(src);
}

const AUTO_MS = 5500;
const PAUSE_AFTER_INTERACTION_MS = 10_000;
const SWIPE_THRESHOLD = 48;

function capturePoster(video: HTMLVideoElement): string | null {
  try {
    const w = Math.max(video.videoWidth, 1);
    const h = Math.max(video.videoHeight, 1);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.75);
  } catch {
    return null;
  }
}

function VideoThumb({ src, className }: { src: string; className?: string }) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => setPoster(null));
    const vid = vidRef.current;
    if (!vid) return;
    const onSeeked = () => {
      const url = capturePoster(vid);
      if (url) setPoster(url);
    };
    vid.addEventListener("seeked", onSeeked, { once: true });
    vid.currentTime = 0.1;
    return () => vid.removeEventListener("seeked", onSeeked);
  }, [src]);

  if (poster) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="" className={className} />;
  }

  return (
    <video
      ref={vidRef}
      src={src}
      muted
      playsInline
      preload="metadata"
      className={className}
    />
  );
}

function MainVideo({
  src,
  visible,
  onPlayingChange,
}: {
  src: string;
  visible: boolean;
  onPlayingChange: (playing: boolean) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = ref.current;
    if (!vid || visible) return;
    vid.pause();
    vid.currentTime = 0;
    onPlayingChange(false);
  }, [visible, onPlayingChange]);

  return (
    <video
      ref={ref}
      src={src}
      controls
      playsInline
      preload={visible ? "auto" : "metadata"}
      className={[
        "absolute inset-0 h-full w-full bg-black object-contain",
        "transition-opacity duration-400 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-hidden={!visible}
      onPlay={() => onPlayingChange(true)}
      onPause={() => onPlayingChange(false)}
      onEnded={() => onPlayingChange(false)}
    />
  );
}

export default function ProductImageGallery({
  images,
  title,
  children,
}: {
  images: string[];
  title: string;
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const resumeAtRef = useRef(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const safeLen = images.length;

  useEffect(() => {
    Promise.resolve().then(() => {
      setActive(0);
      setVideoPlaying(false);
    });
  }, [images]);

  useEffect(() => {
    if (safeLen <= 1) return;
    const tick = () => {
      if (videoPlaying) return;
      if (Date.now() < resumeAtRef.current) return;
      setActive((i) => (i + 1) % safeLen);
    };
    const id = window.setInterval(tick, AUTO_MS);
    return () => window.clearInterval(id);
  }, [safeLen, videoPlaying]);

  const onPick = useCallback((index: number) => {
    resumeAtRef.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
    setActive(index);
    setVideoPlaying(false);
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (safeLen <= 1) return;
      onPick((active + delta + safeLen) % safeLen);
    },
    [active, onPick, safeLen],
  );

  const handlePlayingChange = useCallback((playing: boolean) => {
    setVideoPlaying(playing);
    if (!playing) resumeAtRef.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
  }, []);

  if (safeLen === 0) {
    return (
      <div className="relative grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-border bg-surface-subtle text-sm text-muted">
        No media yet
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-sm sm:aspect-[5/4]"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) < SWIPE_THRESHOLD) return;
          step(dx < 0 ? 1 : -1);
        }}
      >
        {images.map((url, i) => {
          const visible = i === active;
          if (isVideoSrc(url)) {
            return (
              <MainVideo
                key={`${url}-${i}`}
                src={url}
                visible={visible}
                onPlayingChange={handlePlayingChange}
              />
            );
          }
          return (
            <Image
              key={`${url}-${i}`}
              src={url}
              alt={i === 0 ? title : `${title} — image ${i + 1}`}
              fill
              className={[
                "object-cover transition-opacity duration-400 ease-out motion-reduce:transition-none",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
              ].join(" ")}
              sizes="(max-width: 1024px) 100vw, min(640px, 50vw)"
              priority={i === 0}
              unoptimized={userMediaUnoptimized(url)}
              aria-hidden={!visible}
            />
          );
        })}

        {children}

        {safeLen > 1 ? (
          <>
            <span className="pointer-events-none absolute bottom-3 left-1/2 z-[5] -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
              {active + 1} / {safeLen}
            </span>
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 z-[5] hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white sm:grid"
              aria-label="Previous media"
            >
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 z-[5] hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white sm:grid"
              aria-label="Next media"
            >
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      {safeLen > 1 ? (
        <ul
          className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
          aria-label="Product media"
        >
          {images.map((url, i) => {
            const isVideo = isVideoSrc(url);
            const isActive = i === active;
            return (
              <li key={`${url}-thumb-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  className={[
                    "relative size-14 overflow-hidden rounded-lg border transition sm:size-16",
                    isActive
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border opacity-75 hover:opacity-100",
                  ].join(" ")}
                  aria-label={`View ${isVideo ? "video" : "image"} ${i + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {isVideo ? (
                    <>
                      <VideoThumb src={url} className="h-full w-full object-cover" />
                      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
                        <span className="flex size-5 items-center justify-center rounded-full bg-black/70 text-white">
                          <Play className="size-2.5 fill-current" aria-hidden />
                        </span>
                      </span>
                    </>
                  ) : (
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized={userMediaUnoptimized(url)}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
