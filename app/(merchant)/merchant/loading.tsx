import { Skeleton, SkeletonRegion } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <SkeletonRegion label="Loading merchant dashboard" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="dm-card space-y-3 p-5">
            <Skeleton className="h-3 w-24" rounded="md" />
            <Skeleton className="h-8 w-16" rounded="md" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="dm-card space-y-2 p-4">
            <Skeleton className="h-3 w-16" rounded="sm" />
            <Skeleton className="h-7 w-12" rounded="md" />
          </div>
        ))}
      </div>
      <div className="dm-card h-72 p-5">
        <Skeleton className="h-full w-full" rounded="lg" />
      </div>
    </SkeletonRegion>
  );
}
