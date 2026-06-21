"use client";

/**
 * Product list page loading skeleton
 * Mirrors: app/(main)/products/page.tsx → ProductsBrowsePage
 *
 * Layout: search/filter bar → section header → product grid
 */

import { Skeleton, ProductCardSkeleton } from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";
import CategoryFilterBar from "@/components/browse/CategoryFilterBar";

const DUMMY_PRODUCT_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Services",
  "Food",
  "Auto",
];

function FilterBarSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 py-2">
      {/* Search input */}
      <Skeleton className="h-10 flex-1 max-w-sm" rounded="xl" />
      {/* Filter button */}
      <Skeleton className="h-10 w-24" rounded="xl" />
      {/* Sort button */}
      <Skeleton className="h-10 w-24 hidden sm:block" rounded="xl" />
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="dm-container py-6 sm:py-8" aria-busy="true" aria-label="Loading products">
      <div className="space-y-6">
        {/* Category pill bar using real component */}
        <CategoryFilterBar
          categories={DUMMY_PRODUCT_CATEGORIES}
          selected={null}
          onSelect={() => {}}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" rounded="lg" />
              <Skeleton className="h-4 w-80" rounded="md" />
            </div>
            <Skeleton className="h-8 w-24" rounded="md" />
          </div>

          {/* Product grid */}
          <div className={browseProductGridClass}>
            {Array.from({ length: 16 }, (_, i) => (
              <ProductCardSkeleton key={i} delay={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
