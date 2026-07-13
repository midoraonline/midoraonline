/**
 * Skeleton primitives — building blocks for all loading states.
 *
 * - Transform-based shimmer sweep (see globals.css `.dm-skeleton`)
 * - Stagger via `.skeleton-delay-N` on card wrappers
 * - `SkeletonRegion` for accessible busy states
 * - Static chrome (navbar, hero, footer) should stay real — only dynamic content uses these
 */

import type { ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Lighter shimmer for dark backgrounds (e.g. category filter header). */
  onDark?: boolean;
};

export function Skeleton({ className = "", rounded = "md", onDark = false }: SkeletonProps) {
  const r = {
    sm: "rounded",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={`dm-skeleton ${onDark ? "dm-skeleton-on-dark" : ""} ${r} ${className}`}
    />
  );
}

type SkeletonRegionProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

/** Wraps skeleton content with aria-busy + screen-reader status. */
export function SkeletonRegion({
  label = "Loading content",
  children,
  className = "",
}: SkeletonRegionProps) {
  return (
    <div aria-busy="true" aria-label={label} role="status" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** One product card skeleton — mirrors ProductCard's exact dimensions */
export function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
  const delayClass = delay > 0 ? `skeleton-delay-${Math.min(delay, 8)}` : "";

  return (
    <article
      aria-hidden="true"
      className={`dm-product-card overflow-hidden flex flex-col ${delayClass}`}
    >
      <Skeleton className="w-full aspect-square sm:aspect-[4/3]" rounded="sm" />

      <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
        <Skeleton className="h-4 w-4/5" rounded="md" />

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" rounded="md" />
          <Skeleton className="size-7" rounded="full" />
        </div>

        <Skeleton className="h-9 w-full mt-0.5" rounded="xl" />
      </div>
    </article>
  );
}

/** One shop card skeleton — mirrors ShopCard's exact layout */
export function ShopCardSkeleton({ delay = 0 }: { delay?: number }) {
  const delayClass = delay > 0 ? `skeleton-delay-${Math.min(delay, 8)}` : "";

  return (
    <div
      aria-hidden="true"
      className={`flex flex-col rounded-2xl border border-border bg-background shadow-sm ${delayClass}`}
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="size-14 sm:size-16 shrink-0" rounded="xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4" rounded="md" />
            <Skeleton className="h-3 w-1/2" rounded="md" />
            <Skeleton className="h-3 w-2/5" rounded="md" />
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-3 w-full" rounded="md" />
          <Skeleton className="h-3 w-4/5" rounded="md" />
        </div>

        <div className="mt-auto flex gap-2 pt-3">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-16" rounded="full" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
        <Skeleton className="h-3 w-20" rounded="md" />
        <Skeleton className="h-3 w-16" rounded="md" />
      </div>
    </div>
  );
}
