"use client";

import { ChevronRight } from "lucide-react";
import ListingTypeTag from "@/components/ListingTypeTag";
import StepFrame, { OPTION_ROW } from "@/components/post/StepFrame";
import { LISTING_KIND_OPTIONS, type ListingKind } from "@/lib/listingMeta";

export default function ListingTypeStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: ListingKind | null;
  onSelect: (kind: ListingKind) => void;
  onBack: () => void;
}) {
  return (
    <StepFrame title="What are you posting?" subtitle="You can change this before you publish." onBack={onBack}>
      <div className="space-y-2">
        {LISTING_KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={selected === opt.value}
            className={`${OPTION_ROW} ${selected === opt.value ? "border-foreground" : ""}`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                <ListingTypeTag kind={opt.value} />
              </span>
              <span className="mt-0.5 block text-sm text-muted">{opt.hint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        ))}
      </div>
    </StepFrame>
  );
}
