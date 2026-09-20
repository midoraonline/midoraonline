"use client";

import CategoryBrowseSectionSkeleton from "@/components/browse/CategoryBrowseSectionSkeleton";
import {
  ProductCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

/** Home feed loading — compact chrome; product grid shimmers. */
export default function HomeFeedSkeleton() {
  return (
    <SkeletonRegion label="Loading home feed" className="w-full">
      <div className="mb-3 md:hidden">
        <Skeleton className="h-10 w-full" rounded="full" />
      </div>

      <div className="mb-3 space-y-2 sm:mb-4">
        <CategoryBrowseSectionSkeleton />
        <div className="flex gap-1 overflow-hidden py-0.5 sm:gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-[4.25rem] shrink-0 sm:h-8" rounded="md" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-4 w-28" rounded="sm" />
          <Skeleton className="h-3 w-14" rounded="sm" />
        </div>

        <div className={browseProductGridClass}>
          {Array.from({ length: 12 }, (_, i) => (
            <ProductCardSkeleton key={i} delay={i + 1} />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
