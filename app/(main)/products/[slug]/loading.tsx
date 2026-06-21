/**
 * Product detail page loading skeleton
 * Mirrors: app/(main)/products/[slug]/page.tsx
 *
 * Layout:
 *  - Back nav bar
 *  - Two-column at md+: image gallery | product info
 *  - Image gallery: large main image + thumbnail strip
 *  - Info: breadcrumb, title, price, shop badge, desc, WA button
 *  - Below fold: Similar products row
 */

import { Skeleton, ProductCardSkeleton } from "@/components/skeletons/Skeleton";

// ── Image gallery skeleton ────────────────────────────────────────────────
function ImageGallerySkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {/* Main image */}
      <Skeleton className="w-full aspect-square rounded-2xl" rounded="2xl" />

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className={`size-16 shrink-0 sm:size-20 skeleton-delay-${i + 1}`}
            rounded="xl"
          />
        ))}
      </div>
    </div>
  );
}

// ── Product info panel skeleton ───────────────────────────────────────────
function ProductInfoSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      {/* Category breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" rounded="full" />
        <Skeleton className="h-3 w-3" rounded="full" />
        <Skeleton className="h-3 w-24" rounded="full" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-full" rounded="lg" />
        <Skeleton className="h-7 w-3/4" rounded="lg" />
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-36" rounded="lg" />
        <Skeleton className="h-5 w-24" rounded="md" />
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="size-4" rounded="sm" />
          ))}
        </div>
        <Skeleton className="h-3 w-20" rounded="md" />
      </div>

      {/* Shop badge */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3">
        <Skeleton className="size-10 shrink-0" rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" rounded="md" />
          <Skeleton className="h-3 w-20" rounded="md" />
        </div>
        <Skeleton className="h-8 w-24" rounded="xl" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" rounded="md" />
        <Skeleton className="h-3.5 w-full" rounded="md" />
        <Skeleton className="h-3.5 w-5/6" rounded="md" />
        <Skeleton className="h-3.5 w-4/5" rounded="md" />
        <Skeleton className="h-3.5 w-3/4" rounded="md" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <Skeleton className="h-12 flex-1" rounded="xl" />
        <Skeleton className="h-12 w-12 shrink-0" rounded="xl" />
      </div>

      {/* Location + time chips */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-28" rounded="full" />
        <Skeleton className="h-7 w-24" rounded="full" />
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading product details">
      {/* Back nav bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="dm-container flex h-14 items-center gap-3">
          <Skeleton className="h-8 w-20" rounded="xl" />
          <Skeleton className="h-4 w-px" rounded="full" />
          <Skeleton className="h-4 w-32" rounded="md" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="size-9" rounded="xl" />
            <Skeleton className="size-9" rounded="xl" />
          </div>
        </div>
      </div>

      <div className="dm-container py-6 sm:py-8">
        {/* Two-column layout — stacks on mobile */}
        <div className="grid gap-8 md:grid-cols-[1fr_1fr] lg:grid-cols-[55%_1fr] xl:gap-12">
          <ImageGallerySkeleton />
          <ProductInfoSkeleton />
        </div>

        {/* Similar products section */}
        <div className="mt-12 space-y-4">
          <div className="flex items-end justify-between">
            <Skeleton className="h-6 w-40" rounded="lg" />
            <Skeleton className="h-8 w-20" rounded="xl" />
          </div>

          {/* Horizontal scroll row of 4 cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} delay={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
