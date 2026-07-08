import CategoryBrowseSectionSkeleton from "@/components/browse/CategoryBrowseSectionSkeleton";
import {
  ShopCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "@/components/skeletons/Skeleton";
import { browseShopGridClass } from "@/lib/browseCategories";

type Props = {
  /** Show page title + subtitle (static copy) above the shimmer region. */
  showPageHeader?: boolean;
};

/**
 * Shops directory content skeleton — use inside pages that already render
 * navbar, footer, and static page chrome.
 */
export default function ShopsBrowseSkeleton({ showPageHeader = true }: Props) {
  return (
    <SkeletonRegion label="Loading shops">
      {showPageHeader ? (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Browse Shops</h1>
            <Skeleton className="h-5 w-24" rounded="md" />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Discover verified sellers across Uganda — browse by category or search by name.
          </p>
        </div>
      ) : null}

      <div className="mb-4">
        <Skeleton className="h-10 w-full rounded-xl" rounded="xl" />
      </div>

      <CategoryBrowseSectionSkeleton />

      <div className="mt-4 space-y-4">
        <div className={browseShopGridClass}>
          {Array.from({ length: 8 }, (_, i) => (
            <ShopCardSkeleton key={i} delay={i + 1} />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
