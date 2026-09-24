"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";

type Props = {
  items: ProductCardData[];
  speed?: number;
};

const GAP_PX = 12;

/** Card width matches browse columns (2 / 3 / 4) inside this scroller. */
function applyCardWidth(root: HTMLElement) {
  const width = root.clientWidth;
  const cols = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const card = Math.max(0, (width - GAP_PX * (cols - 1)) / cols);
  root.style.setProperty("--marquee-card", `${card}px`);
  return card + GAP_PX;
}

export default function MarqueeCarousel({ items, speed = 50 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const strideRef = useRef(0);
  const countRef = useRef(items.length);
  const speedRef = useRef(speed);

  useEffect(() => {
    countRef.current = items.length;
    speedRef.current = speed;
    const root = scrollRef.current;
    if (!root) return;
    const measure = () => {
      strideRef.current = applyCardWidth(root);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    let last = 0;
    let raf = 0;
    const loop = (time: number) => {
      const delta = last ? time - last : 0;
      last = time;
      if (!pausedRef.current && strideRef.current > 0) {
        root.scrollLeft += (speedRef.current * delta) / 1000;
        const loopAt = countRef.current * strideRef.current;
        if (loopAt > 0 && root.scrollLeft >= loopAt) root.scrollLeft = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [items.length, speed]);

  if (items.length === 0) return null;

  const doubled = [...items, ...items, ...items];

  return (
    <div
      ref={scrollRef}
      className="relative overflow-x-auto scrollbar-none"
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
            className="w-[var(--marquee-card,46%)] shrink-0"
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
