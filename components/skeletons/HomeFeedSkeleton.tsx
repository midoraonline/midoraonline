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

      <CategoryBrowseSectionSkeleton />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <Skeleton className="mb-2.5 h-3 w-24" rounded="md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24" rounded="full" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" rounded="lg" />
            <Skeleton className="h-3.5 w-56" rounded="md" />
          </div>
          <Skeleton className="h-8 w-20" rounded="xl" />
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
