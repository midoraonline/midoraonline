/**
 * Individual shop page loading skeleton
 * Mirrors: app/shops/[...slug]/page.tsx → ShopHeader + tabs + product grid
 *
 * Layout:
 *  - Immersive hero (carousel background + shop info overlay)
 *  - Tab bar
 *  - Product grid below
 */

import { Skeleton, ProductCardSkeleton } from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

// ── Shop hero skeleton ─────────────────────────────────────────────────────
// Mirrors ShopHeroCarousel — full-bleed image with overlaid content
function ShopHeroSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-b border-white/[0.06]"
      style={{ minHeight: "clamp(20rem, 40vw, 28rem)" }}
    >
      {/* Hero background */}
      <Skeleton className="absolute inset-0" rounded="sm" />

      {/* Back nav */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-5 flex items-center justify-between w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)]">
        <Skeleton className="h-7 w-24" rounded="full" />
        <Skeleton className="h-8 w-8" rounded="xl" />
      </div>

      {/* Centered content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pt-16 pb-12">
        {/* Shop logo */}
        <Skeleton className="size-20 sm:size-24" rounded="2xl" />

        {/* Shop name + verified badge */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-48 sm:w-64" rounded="lg" />
          <Skeleton className="h-6 w-20" rounded="full" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="size-3.5" rounded="sm" />
            ))}
          </div>
          <Skeleton className="h-3 w-16" rounded="md" />
        </div>

        {/* Description */}
        <div className="w-full max-w-lg space-y-1.5 text-center">
          <Skeleton className="mx-auto h-3.5 w-3/4" rounded="md" />
          <Skeleton className="mx-auto h-3.5 w-1/2" rounded="md" />
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap justify-center gap-2">
          <Skeleton className="h-7 w-24" rounded="full" />
          <Skeleton className="h-7 w-20" rounded="full" />
          <Skeleton className="h-7 w-28" rounded="full" />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-11 w-40" rounded="xl" />
          <Skeleton className="h-11 w-32" rounded="xl" />
        </div>
      </div>
    </div>
  );
}

// ── Tab bar skeleton ───────────────────────────────────────────────────────
function ShopTabsSkeleton() {
  return (
    <div aria-hidden="true" className="border-b border-border">
      <div className="dm-container flex gap-6 py-0">
        {["w-16", "w-14", "w-20", "w-12"].map((w, i) => (
          <div key={i} className="py-3">
            <Skeleton className={`h-4 ${w}`} rounded="md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading shop">
      {/* Hero */}
      <ShopHeroSkeleton />

      {/* Tabs */}
      <ShopTabsSkeleton />

      {/* Product grid */}
      <div className="dm-container py-6 sm:py-8">
        <div className="space-y-5">
          {/* Grid header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" rounded="lg" />
            <Skeleton className="h-8 w-28" rounded="xl" />
          </div>

          {/* Staggered product grid */}
          <div className={browseProductGridClass}>
            {Array.from({ length: 12 }, (_, i) => (
              <ProductCardSkeleton key={i} delay={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
