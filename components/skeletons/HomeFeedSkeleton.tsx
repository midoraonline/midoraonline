"use client";

import HomeHero from "@/components/home/HomeHero";
import CategoryBrowseSectionSkeleton from "@/components/browse/CategoryBrowseSectionSkeleton";
import {
  ProductCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

/** Home feed loading — hero stays real; only dynamic feed content shimmers. */
export default function HomeFeedSkeleton() {
  return (
    <SkeletonRegion label="Loading home feed" className="w-full">
      <div className="mb-5 sm:mb-6 lg:mb-8">
        <HomeHero />
      </div>

      <div className="mb-4 space-y-2 sm:mb-5">
        <CategoryBrowseSectionSkeleton />
        <div className="flex gap-1 overflow-hidden py-0.5 sm:gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-[4.25rem] shrink-0 sm:h-8" rounded="md" />
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
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
