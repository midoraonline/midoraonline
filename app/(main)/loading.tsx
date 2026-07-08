"use client";

import HomeHero from "@/components/home/HomeHero";
import { Skeleton, ProductCardSkeleton } from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

function CategorySectionSkeleton() {
  return (
    <div
      aria-hidden
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:mb-8"
    >
      <div className="border-b border-border bg-primary px-4 py-3.5 sm:px-5">
        <Skeleton className="h-4 w-36" rounded="md" />
        <Skeleton className="mt-2 h-3 w-56" rounded="md" />
      </div>
      <div className="flex gap-4 overflow-hidden px-4 py-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-2">
            <Skeleton className="size-16" rounded="2xl" />
            <Skeleton className="h-3 w-14" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading home page">
      <div className="mb-5 sm:mb-6 lg:mb-8">
        <HomeHero />
      </div>

      <CategorySectionSkeleton />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
        <Skeleton className="mb-3 h-3 w-24" rounded="md" />
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
    </div>
  );
}
