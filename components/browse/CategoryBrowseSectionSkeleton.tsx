"use client";

import { Skeleton } from "@/components/skeletons/Skeleton";

/** Loading placeholder that matches compact CategoryBrowseSection layout. */
export default function CategoryBrowseSectionSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:flex">
        <Skeleton className="h-11 w-full rounded-full sm:w-28" />
        <Skeleton className="h-11 w-full rounded-full sm:w-36" />
      </div>
      <div className="flex gap-1.5 overflow-hidden py-0.5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-[5.5rem] shrink-0 rounded-full" />
        ))}
      </div>
    </section>
  );
}
