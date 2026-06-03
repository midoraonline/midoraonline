"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";

type Props = {
  items: ProductCardData[];
  speed?: number;
};

export default function MarqueeCarousel({ items, speed = 35 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef(0);

  const cardWidth = 256 + 12;

  const tick = (time: number) => {
    if (!scrollRef.current) return;
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (!pausedRef.current) {
      const pxPerSec = (items.length * cardWidth) / speed;
      const step = (pxPerSec * delta) / 1000;
      const el = scrollRef.current;
      el.scrollLeft += step;
      const half = items.length * cardWidth;
      if (el.scrollLeft >= half) {
        el.scrollLeft = 0;
      }
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
      className="relative overflow-x-auto scrollbar-thin"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <motion.div
        className="flex gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03 } },
        }}
      >
        {doubled.map((p, i) => (
          <motion.div
            key={`${p.id}-${i}`}
            className="w-64 shrink-0"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
