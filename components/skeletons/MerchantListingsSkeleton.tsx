import { Skeleton, SkeletonRegion } from "@/components/skeletons/Skeleton";

export default function MerchantListingsSkeleton() {
  return (
    <SkeletonRegion
      label="Loading your listings"
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-24 pt-4 sm:pt-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" rounded="md" />
          <Skeleton className="h-3 w-64" rounded="md" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-20" rounded="lg" />
          <Skeleton className="h-8 w-28" rounded="lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`dm-card flex flex-col items-start gap-2 p-3 sm:p-4 skeleton-delay-${i + 1}`}
          >
            <Skeleton className="size-8" rounded="lg" />
            <Skeleton className="h-3 w-16" rounded="sm" />
            <Skeleton className="h-6 w-10" rounded="md" />
          </div>
        ))}
      </div>

      {/* Views strip */}
      <Skeleton className="h-3 w-52" rounded="sm" />

      {/* Sticky filter bar */}
      <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
        <Skeleton className="h-10 w-full" rounded="lg" />
        <div className="flex gap-1.5 overflow-x-auto">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-7 w-20 shrink-0"
              rounded="lg"
            />
          ))}
        </div>
      </div>

      {/* Row cards */}
      <ul className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li
            key={i}
            className={`dm-card p-3 sm:p-4 skeleton-delay-${Math.min(i + 1, 8)}`}
          >
            <div className="flex gap-3 sm:gap-4">
              <Skeleton className="size-20 shrink-0 sm:size-24" rounded="xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/4" rounded="md" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-4 w-16" rounded="full" />
                      <Skeleton className="h-4 w-12" rounded="full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" rounded="md" />
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Skeleton className="h-6 w-14" rounded="lg" />
                  <Skeleton className="h-6 w-16" rounded="lg" />
                  <Skeleton className="ml-auto h-6 w-20" rounded="lg" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}
