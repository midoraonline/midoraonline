/**
 * Skeleton primitives — building blocks for all loading states.
 *
 * Design decisions:
 * - Single slow (2s) left-to-right shimmer (research-backed best pattern)
 * - Stagger via `.skeleton-delay-N` classes on card wrappers
 * - aria-hidden so screen readers ignore decorative bones
 * - `prefers-reduced-motion` handled in globals.css (static grey box)
 */

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
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
      className={`dm-skeleton ${r} ${className}`}
    />
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
      {/* Image — aspect-square on mobile, 4/3 on sm+ (matches ProductCard) */}
      <Skeleton className="w-full aspect-square sm:aspect-[4/3]" rounded="sm" />

      {/* Body */}
      <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
        {/* Title */}
        <Skeleton className="h-4 w-4/5" rounded="md" />

        {/* Price + like */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" rounded="md" />
          <Skeleton className="size-7" rounded="full" />
        </div>

        {/* WhatsApp button */}
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
        {/* Logo + identity row */}
        <div className="flex items-start gap-3">
          <Skeleton className="size-14 sm:size-16 shrink-0" rounded="xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4" rounded="md" />
            <Skeleton className="h-3 w-1/2" rounded="md" />
            <Skeleton className="h-3 w-2/5" rounded="md" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-3 w-full" rounded="md" />
          <Skeleton className="h-3 w-4/5" rounded="md" />
        </div>

        {/* Contact badges */}
        <div className="mt-auto flex gap-2 pt-3">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-16" rounded="full" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
        <Skeleton className="h-3 w-20" rounded="md" />
        <Skeleton className="h-3 w-16" rounded="md" />
      </div>
    </div>
  );
}
