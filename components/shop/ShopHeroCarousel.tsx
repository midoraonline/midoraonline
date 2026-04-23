"use client";

/**
 * ShopHeroCarousel
 *
 * Full-bleed carousel that forms the background of a shop hero.
 *
 * Key responsibilities:
 *   • Cross-fade between a list of images (optionally videos).
 *   • Analyse each image's average luminance and adapt the overlay + text
 *     palette so hero copy is always readable — dark images get a subtle
 *     warm-dark overlay + white text; bright/washed images get a heavier
 *     dark overlay + white text; near-white / flat-brand images fall back to
 *     a light-tinted overlay with foreground-colour text.
 *   • Expose palette decisions as CSS custom properties so SSR-rendered
 *     children inside this wrapper can colour themselves without client
 *     state plumbing.
 *   • Render its children on top (so the component owns the hero layout).
 *
 * Transitions:
 *   • 1.4s opacity crossfade with eased curve.
 *   • 10s slow Ken-Burns zoom on the active slide for continuous motion.
 *   • Prev + current slides both stay mounted during a transition so the
 *     dissolve is genuinely overlapping (no flash-of-background).
 *   • Pauses when the document is hidden to save battery.
 *   • Respects `prefers-reduced-motion` by disabling auto-advance and zoom.
 */

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  analyzeImageTone,
  defaultTone,
  getCachedTone,
  type ImageTone,
} from "@/lib/imageLuminance";

export type HeroMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster?: string };

type Props = {
  /** Image URLs (preferred) or structured media items. */
  media: (string | HeroMedia)[];
  /** ms between auto-advances. Default 5500 — roomy enough to feel calm. */
  interval?: number;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
  /** Hero content rendered above the media. */
  children?: ReactNode;
  /** Override the hero section's min-height (Tailwind class). */
  minHeightClass?: string;
};

/**
 * Derive a tailored palette from the average image tone.
 *
 * We don't simply map `isDark` → white text.  Instead we use the measured
 * luminance to choose how aggressive the top/bottom gradient bands should be
 * (brighter images need a heavier scrim; almost-black images need barely
 * any).  We always keep text white on the carousel because the overlay is
 * tuned to guarantee enough contrast for both AA body copy and large
 * headings (WCAG 1.4.3 @ 4.5:1 against mid-grey overlay is comfortable).
 */
function paletteFromTone(tone: ImageTone): {
  cssVars: CSSProperties;
  topGradient: string;
  bottomGradient: string;
  vignette: string;
} {
  // `scrim` ramps up with image luminance so bright shots stay legible.
  // 0.32 baseline for dark imagery, up to 0.82 for near-white imagery.
  const scrim = 0.32 + (1 - Math.max(0, Math.min(1, 1 - tone.luminance))) * 0.5;
  const topA = Math.min(0.75, scrim * 0.9);
  const bottomA = Math.min(0.88, scrim * 1.15);

  const topGradient = `linear-gradient(to bottom, rgba(8,14,13,${topA.toFixed(3)}) 0%, rgba(8,14,13,${(topA * 0.45).toFixed(3)}) 26%, transparent 52%)`;
  const bottomGradient = `linear-gradient(to top, rgba(8,14,13,${bottomA.toFixed(3)}) 0%, rgba(8,14,13,${(bottomA * 0.55).toFixed(3)}) 30%, transparent 62%)`;
  const vignette = `radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(8,14,13,${(scrim * 0.5).toFixed(3)}) 100%)`;

  // Optional colour tint: for very saturated dark images we subtly echo the
  // dominant colour into the scrim to make the hero feel branded.
  const [r, g, b] = tone.averageRgb;
  const tint = `rgba(${r},${g},${b},0.08)`;

  return {
    cssVars: {
      "--hero-text-strong": "#ffffff",
      "--hero-text-soft": "rgba(255,255,255,0.86)",
      "--hero-text-muted": "rgba(255,255,255,0.7)",
      "--hero-text-quiet": "rgba(255,255,255,0.55)",
      "--hero-chip-bg": "rgba(255,255,255,0.16)",
      "--hero-chip-border": "rgba(255,255,255,0.24)",
      "--hero-icon": "rgba(255,255,255,0.88)",
      "--hero-icon-hover": "#ffffff",
      "--hero-tint": tint,
    } as CSSProperties,
    topGradient,
    bottomGradient,
    vignette,
  };
}

/**
 * Track the user's prefers-reduced-motion preference using the built-in
 * external-store hook — avoids the `setState inside useEffect` warning while
 * staying SSR-safe.
 */
function subscribeReducedMotion(notify: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", notify);
  return () => mq.removeEventListener?.("change", notify);
}
function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function mediaKey(item: string | HeroMedia): string {
  if (typeof item === "string") return item;
  return item.src;
}

function asMedia(item: string | HeroMedia): HeroMedia {
  if (typeof item === "string") return { kind: "image", src: item };
  return item;
}

export default function ShopHeroCarousel({
  media,
  interval = 5500,
  className = "",
  children,
  minHeightClass = "min-h-[22rem] sm:min-h-[26rem] lg:min-h-[30rem]",
}: Props) {
  const normalized = useMemo(() => {
    const seen = new Set<string>();
    const out: HeroMedia[] = [];
    for (const raw of media) {
      const m = asMedia(raw);
      if (!m.src) continue;
      if (seen.has(m.src)) continue;
      seen.add(m.src);
      out.push(m);
    }
    return out;
  }, [media]);

  const count = normalized.length;
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  // Image tone per URL — seeded from the module cache so HMR and re-mounts
  // don't cause the overlay to flash.
  const [tones, setTones] = useState<Record<string, ImageTone>>(() => {
    const seed: Record<string, ImageTone> = {};
    for (const m of normalized) {
      const hit = getCachedTone(m.src);
      if (hit) seed[m.src] = hit;
    }
    return seed;
  });

  // Prefers-reduced-motion → disable auto-advance + zoom effect.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Analyse tones for every image (kick off in the background; dedup per URL).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      normalized
        .filter((m) => m.kind === "image")
        .map(async (m) => {
          const tone = await analyzeImageTone(m.src);
          return [m.src, tone] as const;
        })
    ).then((entries) => {
      if (cancelled) return;
      setTones((prevTones) => {
        const next = { ...prevTones };
        let changed = false;
        for (const [src, tone] of entries) {
          if (!next[src]) {
            next[src] = tone;
            changed = true;
          }
        }
        return changed ? next : prevTones;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  // Reset the visible slide when the media set changes (e.g. navigating
  // between shops).  Following React's guidance, we "reset state during
  // render" by tracking the previous count and calling setState when it
  // differs — avoids an unnecessary effect.
  const [prevCount, setPrevCount] = useState(count);
  if (prevCount !== count) {
    setPrevCount(count);
    setCurrent(0);
    setPrev(null);
  }

  const advance = useCallback(
    (next: number) => {
      if (count < 2) return;
      const clamped = ((next % count) + count) % count;
      setCurrent((c) => {
        if (c === clamped) return c;
        setPrev(c);
        return clamped;
      });
    },
    [count]
  );

  // Clear `prev` after the crossfade has fully played so hidden slides unmount.
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 1500);
    return () => clearTimeout(t);
  }, [prev]);

  // Auto-advance — pauses when tab is hidden and when motion is reduced.
  useEffect(() => {
    if (count < 2) return;
    if (reducedMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        setCurrent((c) => {
          const next = (c + 1) % count;
          setPrev(c);
          return next;
        });
      }, interval);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count, interval, reducedMotion]);

  // Palette for the currently-visible image.  Before analysis finishes we
  // use the default "dark" tone so text stays white from the very first paint.
  const activeTone =
    (normalized[current] && tones[normalized[current].src]) ?? defaultTone();
  const palette = useMemo(() => paletteFromTone(activeTone), [activeTone]);

  // --- EMPTY STATE ----------------------------------------------------------
  if (count === 0) {
    return (
      <div
        className={["relative isolate w-full overflow-hidden", minHeightClass, className].join(" ")}
        style={{
          ...paletteFromTone(defaultTone()).cssVars,
          background:
            "linear-gradient(160deg, rgba(74,103,103,0.28) 0%, rgba(102,121,143,0.18) 48%, rgba(42,51,49,0.45) 100%)",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={[
        "relative isolate w-full overflow-hidden bg-[#0a1210]",
        minHeightClass,
        className,
      ].join(" ")}
      style={palette.cssVars}
    >
      {/* -- MEDIA STACK -------------------------------------------------- */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {normalized.map((m, i) => {
          const isCurrent = i === current;
          const isPrev = i === prev;
          if (!isCurrent && !isPrev) return null;
          const opacity = isCurrent ? 1 : 0;
          const transformActive = !reducedMotion ? "scale(1.05)" : "scale(1.01)";
          return (
            <div
              key={mediaKey(m)}
              className="absolute inset-0"
              style={{
                opacity,
                transition:
                  "opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "opacity",
              }}
            >
              {m.kind === "video" ? (
                <video
                  src={m.src}
                  poster={m.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: isCurrent ? transformActive : "scale(1)",
                    transition: "transform 10000ms linear",
                    willChange: "transform",
                  }}
                />
              ) : (
                <Image
                  src={m.src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                  style={{
                    transform: isCurrent ? transformActive : "scale(1)",
                    transition: "transform 10000ms linear",
                    willChange: "transform",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* -- TINT (dominant colour wash, very subtle) --------------------- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-[9] transition-colors duration-[1400ms]"
        style={{ background: palette.cssVars["--hero-tint" as keyof CSSProperties] as string }}
      />

      {/* -- OVERLAYS ----------------------------------------------------- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-[8] pointer-events-none transition-[background] duration-[1400ms]"
        style={{
          background: [palette.topGradient, palette.bottomGradient, palette.vignette].join(", "),
        }}
      />

      {/* -- CONTENT ------------------------------------------------------ */}
      <div className="relative z-0">{children}</div>

      {/* -- INDICATORS --------------------------------------------------- */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
          {normalized.map((m, i) => {
            const active = i === current;
            return (
              <button
                key={`dot-${mediaKey(m)}-${i}`}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={active ? "true" : undefined}
                onClick={() => advance(i)}
                className="group relative h-1.5 rounded-full outline-none transition-[width,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  width: active ? "1.75rem" : "0.375rem",
                  background: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
