"use client";

import { Skeleton } from "@/components/skeletons/Skeleton";

/** Loading placeholder that matches compact CategoryBrowseSection layout. */
export default function CategoryBrowseSectionSkeleton() {
  return (
    <section
      aria-hidden
      className="mb-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm sm:mb-6 sm:rounded-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <div className="space-y-1">
          <Skeleton onDark className="h-3.5 w-28" rounded="md" />
          <Skeleton onDark className="hidden h-3 w-44 sm:block" rounded="md" />
        </div>
        <Skeleton onDark className="h-6 w-16" rounded="full" />
      </div>

      <div className="flex items-start gap-2 overflow-hidden px-2 py-3 sm:gap-3 sm:px-4 sm:py-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex w-[60px] shrink-0 flex-col items-center gap-1 sm:w-[68px]">
            <Skeleton className="size-11 sm:size-12" rounded="xl" />
            <Skeleton className="h-2.5 w-10" rounded="sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
