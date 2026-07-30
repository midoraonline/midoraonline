"use client";

import { Skeleton } from "@/components/skeletons/Skeleton";

/** Loading placeholder that matches compact CategoryBrowseSection layout. */
export default function CategoryBrowseSectionSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <Skeleton className="h-3 w-20" rounded="sm" />
        <Skeleton className="h-3 w-14" rounded="sm" />
      </div>

      <div className="flex gap-1 overflow-hidden py-0.5 sm:gap-1.5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-[4.5rem] shrink-0 sm:h-8" rounded="md" />
        ))}
      </div>
    </section>
  );
}
