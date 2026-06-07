"use client";

import { useEffect, useRef } from "react";
import ShopCard from "@/components/shopcard";
import type { ShopCardData } from "@/components/shopcard";

type Props = {
  items: ShopCardData[];
  speed?: number;
};

const CARD_WIDTH = 288 + 12; // w-72 + gap-3

export default function ShopMarqueeCarousel({ items, speed = 50 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const tick = (time: number) => {
    if (!scrollRef.current) return;
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (!pausedRef.current) {
      const step = (speed * delta) / 1000;
      const el = scrollRef.current;
      el.scrollLeft += step;
      const half = items.length * CARD_WIDTH;
      if (el.scrollLeft >= half) el.scrollLeft = 0;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [items, speed]);

  if (items.length === 0) return null;

  const doubled = [...items, ...items, ...items];

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto scrollbar-none"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { pausedRef.current = false; }}
    >
      <div className="flex gap-3">
        {doubled.map((shop, i) => (
          <div key={`${shop.id}-${i}`} className="w-72 shrink-0 self-stretch">
            <ShopCard shop={shop} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
