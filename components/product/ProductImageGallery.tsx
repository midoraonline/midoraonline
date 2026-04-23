"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

function userMediaUnoptimized(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

function isVideoSrc(src: string) {
  const clean = src.split(/[?#]/, 1)[0];
  return /\.(mp4|webm|mov|m4v)$/i.test(clean);
}

const AUTO_MS = 5500;
const PAUSE_AFTER_INTERACTION_MS = 10_000;

// ── Video poster (canvas frame capture) ──────────────────────────────────────

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

/**
 * Renders a static thumbnail for a video.  The component seeks to 0.1 s using
 * the `seeked` event then paints the frame onto a canvas.  Until the frame is
 * ready it shows the native video element (most browsers show the first frame
 * on metadata load anyway) so there is no blank flash.
 */
function VideoThumb({ src, className }: { src: string; className?: string }) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    setPoster(null);
    const vid = vidRef.current;
    if (!vid) return;

    const onSeeked = () => {
      const url = capturePoster(vid);
      if (url) setPoster(url);
    };
    vid.addEventListener("seeked", onSeeked, { once: true });
    // Seek to 0.1 s — frame 0 is sometimes black in H.264 streams
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

// ── Full-size video player ────────────────────────────────────────────────────

type MainVideoProps = {
  src: string;
  visible: boolean;
  onPlayingChange: (playing: boolean) => void;
  className?: string;
};

function MainVideo({ src, visible, onPlayingChange, className = "" }: MainVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  // Pause and reset when the slide is hidden
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
        "absolute inset-0 h-full w-full object-contain bg-black",
        "transition-[opacity] duration-500 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      ].join(" ")}
      aria-hidden={!visible}
      onPlay={() => onPlayingChange(true)}
      onPause={() => onPlayingChange(false)}
      onEnded={() => onPlayingChange(false)}
    />
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

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
  const resumeAt = useRef<number>(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const safeLen = images.length;

  useEffect(() => {
    setActive(0);
    setVideoPlaying(false);
  }, [images]);

  // Auto-advance: skips while a video is actively playing
  useEffect(() => {
    if (safeLen <= 1) return;
    const tick = () => {
      if (typeof window === "undefined") return;
      if (videoPlaying) return;
      if (Date.now() < resumeAt.current) return;
      setActive((i) => (i + 1) % safeLen);
    };
    const id = window.setInterval(tick, AUTO_MS);
    return () => window.clearInterval(id);
  }, [safeLen, videoPlaying]);

  const onPick = (index: number) => {
    resumeAt.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
    setActive(index);
    setVideoPlaying(false);
  };

  const handlePlayingChange = useCallback((playing: boolean) => {
    setVideoPlaying(playing);
    // While a video is playing, freeze auto-advance indefinitely;
    // after it stops give the user 10 s before the carousel resumes.
    resumeAt.current = playing
      ? Date.now() + 999_999_000
      : Date.now() + PAUSE_AFTER_INTERACTION_MS;
  }, []);

  if (safeLen === 0) {
    return (
      <div className="relative grid aspect-[4/3] place-items-center rounded-3xl border border-dashed border-foreground/[0.12] bg-foreground/[0.03] text-sm text-muted">
        No image
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Main viewer ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-foreground/[0.08] bg-foreground/[0.04] shadow-sm">
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

          const commonCls = [
            "absolute inset-0 object-cover",
            "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
            visible ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ");

          return (
            <Image
              key={`${url}-${i}`}
              src={url}
              alt={i === 0 ? title : `${title} — image ${i + 1}`}
              fill
              className={commonCls}
              sizes="(max-width: 1024px) 100vw, min(896px, 50vw)"
              priority={i === 0}
              unoptimized={userMediaUnoptimized(url)}
              aria-hidden={!visible}
            />
          );
        })}
        {children}
      </div>

      {/* ── Thumbnail strip ── */}
      {safeLen > 1 ? (
        <ul
          className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-1"
          aria-label="Product media"
        >
          {images.map((url, i) => {
            const isVideo = isVideoSrc(url);
            const isActive = i === active;
            return (
              <li key={`${url}-thumb-${i}`} className="snap-start">
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  className={[
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border",
                    "bg-foreground/[0.04] transition-[box-shadow,transform] duration-200",
                    "motion-reduce:transition-none",
                    isActive
                      ? "scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent"
                      : "border-border opacity-75 hover:opacity-100",
                    "sm:h-20 sm:w-20",
                  ].join(" ")}
                  aria-label={`View ${isVideo ? "video" : "image"} ${i + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {isVideo ? (
                    <>
                      <VideoThumb src={url} className="h-full w-full object-cover" />
                      {/* Play badge */}
                      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
                        <span className="flex size-6 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </span>
                    </>
                  ) : (
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
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
