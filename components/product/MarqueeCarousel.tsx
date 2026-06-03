"use client";

import { useEffect } from "react";
import { useAnimationControls } from "framer-motion";
import { motion } from "framer-motion";
import ProductCard from "@/components/productcard";
import type { ProductCardData } from "@/components/productcard";

type Props = {
  items: ProductCardData[];
  speed?: number;
};

export default function MarqueeCarousel({ items, speed = 35 }: Props) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      x: ["0%", "-50%"],
      transition: { repeat: Infinity, duration: speed, ease: "linear" },
    });
  }, [controls, speed]);

  const pause = () => controls.stop();
  const resume = () => {
    controls.start({
      x: ["0%", "-50%"],
      transition: { repeat: Infinity, duration: speed, ease: "linear" },
    });
  };

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <motion.div
        className="flex gap-3"
        animate={controls}
        initial={false}
      >
        {doubled.map((p, i) => (
          <div key={`${p.id}-${i}`} className="w-64 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
