"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

function userMediaUnoptimized(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

const AUTO_MS = 5500;
const PAUSE_AFTER_INTERACTION_MS = 10000;

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

  const safeLen = images.length;

  useEffect(() => {
    setActive(0);
  }, [images]);

  useEffect(() => {
    if (safeLen <= 1) return;
    const tick = () => {
      if (typeof window === "undefined") return;
      if (Date.now() < resumeAt.current) return;
      setActive((i) => (i + 1) % safeLen);
    };
    const id = window.setInterval(tick, AUTO_MS);
    return () => window.clearInterval(id);
  }, [safeLen]);

  const onPick = (index: number) => {
    resumeAt.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
    setActive(index);
  };

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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-foreground/[0.08] bg-foreground/[0.04] shadow-sm">
        {images.map((url, i) => (
          <Image
            key={`${url}-${i}`}
            src={url}
            alt={i === 0 ? title : `${title} — image ${i + 1}`}
            fill
            className={`object-cover transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
              i === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            sizes="(max-width: 1024px) 100vw, min(896px, 50vw)"
            priority={i === 0}
            unoptimized={userMediaUnoptimized(url)}
            aria-hidden={i !== active}
          />
        ))}
        {children}
      </div>

      {safeLen > 1 ? (
        <ul
          className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-1"
          aria-label="Product images"
        >
          {images.map((url, i) => (
            <li key={`${url}-thumb-${i}`} className="snap-start">
              <button
                type="button"
                onClick={() => onPick(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-foreground/[0.04] transition-[box-shadow,transform] duration-200 motion-reduce:transition-none sm:h-20 sm:w-20 ${
                  i === active
                    ? "scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border opacity-90 hover:opacity-100"
                } `}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={userMediaUnoptimized(url)}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
