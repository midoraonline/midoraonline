import CategoryBrowseSectionSkeleton from "@/components/browse/CategoryBrowseSectionSkeleton";
import {
  ProductCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/skeletons/Skeleton";
import { browseProductGridClass } from "@/lib/browseCategories";

/** Products browse page — category filter + grid shimmer only. */
export default function ProductsBrowseSkeleton() {
  return (
    <SkeletonRegion label="Loading products" className="space-y-6">
      <CategoryBrowseSectionSkeleton />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" rounded="lg" />
            <Skeleton className="h-4 w-64 max-w-full sm:w-80" rounded="md" />
          </div>
          <Skeleton className="h-8 w-24" rounded="md" />
        </div>

        <div className={browseProductGridClass}>
          {Array.from({ length: 16 }, (_, i) => (
            <ProductCardSkeleton key={i} delay={i + 1} />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
