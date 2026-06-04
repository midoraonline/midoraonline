"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  headline: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  gradient: string;
  accent: string;
};

const slides: Slide[] = [
  {
    id: "discover",
    headline: "Discover local shops and products across Africa",
    subtitle: "Browse verified sellers, message merchants, and shop with confidence — all in one place.",
    cta: "Start exploring",
    ctaHref: "/products",
    gradient: "from-[#0F172A] via-[#1A2A4A] to-[#D4653C]/30",
    accent: "#D4653C",
  },
  {
    id: "sell",
    headline: "Open your online shop in minutes",
    subtitle: "Join thousands of African merchants. List products, reach customers, and grow your business.",
    cta: "Open a shop",
    ctaHref: "/open-shop",
    gradient: "from-[#0F172A] via-[#1E3A5F] to-[#059669]/30",
    accent: "#059669",
  },
  {
    id: "trending",
    headline: "Trending products handpicked for you",
    subtitle: "From fashion to electronics — discover what's popular in your community right now.",
    cta: "Browse trending",
    ctaHref: "/products",
    gradient: "from-[#0F172A] via-[#3A1A2A] to-[#D97706]/30",
    accent: "#D97706",
  },
  {
    id: "community",
    headline: "Shop local, support your community",
    subtitle: "Every purchase helps a local business thrive. Midora connects you with shops near you.",
    cta: "Find shops",
    ctaHref: "/shops",
    gradient: "from-[#0F172A] via-[#1A2A3A] to-[#8B5CF6]/30",
    accent: "#8B5CF6",
  },
];

function SlideContent({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-6 sm:p-10 lg:p-14 transition-all duration-700 ease-out ${
        isActive
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1
          className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl"
          style={{ transitionDelay: "200ms" }}
        >
          {slide.headline}
        </h1>
        <p
          className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base lg:text-lg"
          style={{ transitionDelay: "350ms" }}
        >
          {slide.subtitle}
        </p>
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          style={{ transitionDelay: "500ms" }}
        >
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-foreground shadow-lg transition-all hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5"
          >
            {slide.cta}
          </Link>
          <Link
            href="/aboutus"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/85 backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/30"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomeHeroSlider() {
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
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, total]);

  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Background gradient */}
      <div
        className={`relative h-[340px] sm:h-[400px] lg:h-[480px] bg-gradient-to-br transition-all duration-1000 ease-out ${slides[current].gradient}`}
      >
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl transition-colors duration-1000"
            style={{ backgroundColor: slides[current].accent }}
          />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white opacity-[0.04] blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white opacity-[0.03] blur-2xl" />
          {/* Grid pattern overlay */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Slides */}
        {slides.map((slide, i) => (
          <SlideContent key={slide.id} slide={slide} isActive={i === current} />
        ))}

        {/* Navigation arrows */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white dm-focus sm:left-5 sm:size-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-4 sm:size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white dm-focus sm:right-5 sm:size-10"
          aria-label="Next slide"
        >
          <ChevronRight className="size-4 sm:size-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 dm-focus ${
                i === current
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/60 backdrop-blur-sm sm:right-5 sm:top-5">
            Paused
          </div>
        )}
      </div>
    </section>
  );
}
