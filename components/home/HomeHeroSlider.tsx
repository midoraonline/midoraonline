"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Slide = {
  id: string;
  headline: string;
  highlightWord: string;
  subtitle: string;
  bgImage: string;
  gradient: string;
};

const slides: Slide[] = [
  {
    id: "discover",
    headline: "Find what you need near you –",
    highlightWord: "fast.",
    subtitle: "Real sellers. Clear prices. No scams. No stress.",
    bgImage: "/hero_lady_market.png",
    gradient: "from-black/90 via-black/50 to-transparent",
  },
  {
    id: "sell",
    headline: "Open your online shop in",
    highlightWord: "minutes.",
    subtitle: "Join thousands of African merchants. List products, reach customers, and grow.",
    bgImage: "", // fallback to solid/gradient or feed image
    gradient: "from-[#0F172A] via-[#1E3A5F] to-[#059669]/30",
  },
  {
    id: "community",
    headline: "Shop local, support your",
    highlightWord: "community.",
    subtitle: "Every purchase helps a local business thrive. Midora connects you with shops near you.",
    bgImage: "",
    gradient: "from-[#0F172A] via-[#1A2A3A] to-[#8B5CF6]/30",
  },
];

function SlideContent({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center p-6 sm:p-12 lg:p-16 transition-all duration-700 ease-out ${
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* Left-aligned content */}
      <div className="relative z-10 max-w-xl space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
            {slide.headline} <br />
            <span className="text-orange-500">{slide.highlightWord}</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-sm">
            {slide.subtitle}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/products"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-full transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95 cursor-pointer"
          >
            Browse Products
          </Link>
          <Link
            href="/open-shop"
            className="px-6 py-3 bg-black/60 border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs rounded-full backdrop-blur-xs transition-all hover:bg-black/80 active:scale-95 cursor-pointer"
          >
            Sell an Item
          </Link>
        </div>

        {/* Features Row (Consistent Orange Icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="verified_user" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Verified sellers</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Shop with confidence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="location_on" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Local deals</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Near you in Kampala</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <MaterialSymbol name="bolt" className="!text-sm" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-100 leading-none">Fast response</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">Chat directly with sellers</p>
            </div>
          </div>
        </div>

        {/* Bottom capsule */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/45 backdrop-blur-xs text-[10px] font-semibold text-neutral-200 rounded-full border border-white/5 shadow-sm">
          <MaterialSymbol name="local_fire_department" className="!text-xs text-orange-500" />
          <span>128 new listings added today in Kampala</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeHeroSlider({ bgImages = [] }: { bgImages?: string[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + total) % total);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, total]);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-neutral-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Slider Viewport */}
      <div className="relative h-[480px] sm:h-[520px] lg:h-[560px] transition-all duration-1000 ease-out">
        {/* Per-slide Backgrounds */}
        {slides.map((slide, i) => {
          const img = slide.bgImage || bgImages[i];
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              {img ? (
                <img
                  src={img}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${slide.gradient}`} />
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent md:from-black/75 md:via-black/35 md:to-transparent" />
            </div>
          );
        })}

        {/* Decorative grids */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white opacity-[0.02] blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.02]" aria-hidden>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Slides list */}
        {slides.map((slide, i) => (
          <SlideContent key={slide.id} slide={slide} isActive={i === current} />
        ))}

        {/* Control arrows */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-4 bottom-4 z-20 grid size-8 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-xs transition-all hover:bg-white/20 hover:text-white cursor-pointer sm:left-6 sm:size-9"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute left-14 bottom-4 z-20 grid size-8 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-xs transition-all hover:bg-white/20 hover:text-white cursor-pointer sm:left-17 sm:size-9"
          aria-label="Next slide"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Dots indicators */}
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-6 h-1.5 bg-orange-500" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
