"use client";

import { Skeleton } from "@/components/skeletons/Skeleton";

/** Loading placeholder that matches compact CategoryBrowseSection layout. */
export default function CategoryBrowseSectionSkeleton() {
  return (
    <section aria-hidden>
      <div className="flex gap-1.5 overflow-hidden py-0.5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-[5.5rem] shrink-0 rounded-full" />
        ))}
      </div>
    </section>
  );
}
