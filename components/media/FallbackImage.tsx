"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export function userMediaUnoptimized(src: string): boolean {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

type Props = {
  urls: string[];
  alt: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Called once every URL has failed. */
  onExhausted?: () => void;
  fallback?: ReactNode;
};

export default function FallbackImage({
  urls,
  alt,
  className,
  style,
  sizes,
  fill = false,
  width,
  height,
  priority,
  onExhausted,
  fallback = null,
}: Props) {
  const list = urls.map((url) => url.trim()).filter(Boolean);
  const listKey = list.join("\0");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [listKey]);

  const exhausted = list.length === 0 || index >= list.length;

  useEffect(() => {
    if (exhausted) onExhausted?.();
  }, [exhausted, onExhausted]);

  if (exhausted) return <>{fallback}</>;

  const src = list[index];
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill || undefined}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
      unoptimized={userMediaUnoptimized(src)}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
