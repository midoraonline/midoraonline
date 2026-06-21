"use client";

import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import CategoryFilterBar from "@/components/browse/CategoryFilterBar";
import { Skeleton, ProductCardSkeleton } from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

const DUMMY_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Services",
  "Food",
  "Auto",
];

function SectionHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-end justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" rounded="lg" />
        <Skeleton className="h-3.5 w-64" rounded="md" />
      </div>
      <Skeleton className="h-8 w-20" rounded="xl" />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading home page">
      {/* 1. Real Hero without bgImages shows animated gradients and text instantly */}
      <div className="mb-5 sm:mb-6 lg:mb-8">
        <HomeHeroSlider bgImages={[]} />
      </div>

      <div className="space-y-8 sm:space-y-10 lg:space-y-12">
        {/* 2. Real Category bar with dummy popular categories */}
        <CategoryFilterBar
          categories={DUMMY_CATEGORIES}
          selected={null}
          onSelect={() => {}}
        />

        {/* 3. Section header */}
        <div className="space-y-4">
          <SectionHeaderSkeleton />

          {/* 4. Product grid — staggered per card */}
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
