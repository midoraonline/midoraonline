import {
  ProductCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

function ShopHeroSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-b border-white/[0.06]"
      style={{ minHeight: "clamp(20rem, 40vw, 28rem)" }}
    >
      <Skeleton className="absolute inset-0" rounded="sm" />

      <div className="absolute left-4 top-4 flex w-[calc(100%-2rem)] items-center justify-between sm:left-6 sm:top-5 sm:w-[calc(100%-3rem)]">
        <Skeleton className="h-7 w-24" rounded="full" />
        <Skeleton className="h-8 w-8" rounded="xl" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-12 pt-16">
        <Skeleton className="size-20 sm:size-24" rounded="2xl" />

        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-48 sm:w-64" rounded="lg" />
          <Skeleton className="h-6 w-20" rounded="full" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="size-3.5" rounded="sm" />
            ))}
          </div>
          <Skeleton className="h-3 w-16" rounded="md" />
        </div>

        <div className="w-full max-w-lg space-y-1.5 text-center">
          <Skeleton className="mx-auto h-3.5 w-3/4" rounded="md" />
          <Skeleton className="mx-auto h-3.5 w-1/2" rounded="md" />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Skeleton className="h-7 w-24" rounded="full" />
          <Skeleton className="h-7 w-20" rounded="full" />
          <Skeleton className="h-7 w-28" rounded="full" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-11 w-40" rounded="xl" />
          <Skeleton className="h-11 w-32" rounded="xl" />
        </div>
      </div>
    </div>
  );
}

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
    <SkeletonRegion label="Loading shop">
      <ShopHeroSkeleton />
      <ShopTabsSkeleton />

      <div className="dm-container py-6 sm:py-8">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" rounded="lg" />
            <Skeleton className="h-8 w-28" rounded="xl" />
          </div>

          <div className={browseProductGridClass}>
            {Array.from({ length: 12 }, (_, i) => (
              <ProductCardSkeleton key={i} delay={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
