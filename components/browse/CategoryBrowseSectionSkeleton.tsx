"use client";

import { Skeleton } from "@/components/skeletons/Skeleton";

/** Loading placeholder that matches compact CategoryBrowseSection layout. */
export default function CategoryBrowseSectionSkeleton({
  pinnedCount = 2,
}: {
  pinnedCount?: number;
}) {
  return (
    <section aria-hidden>
      <div className="mb-2 flex items-stretch gap-1.5 sm:gap-2">
        {Array.from({ length: pinnedCount }, (_, i) => (
          <Skeleton key={i} className="h-11 min-w-0 flex-1 rounded-full sm:w-36 sm:flex-none" />
        ))}
      </div>
      <div className="flex gap-1.5 overflow-hidden py-0.5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-[5.5rem] shrink-0 rounded-full" />
        ))}
      </div>
    </section>
  );
}
