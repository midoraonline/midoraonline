"use client";

import ListingTypeTag from "@/components/ListingTypeTag";
import StepFrame from "@/components/post/StepFrame";
import { LISTING_KIND_OPTIONS, type ListingKind } from "@/lib/listingMeta";

const ACCENT: Record<ListingKind, string> = {
  product: "border-l-listing-product-accent",
  service: "border-l-listing-service-accent",
  opportunity: "border-l-listing-opportunity-accent",
};

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
    <StepFrame
      title="What are you posting?"
      subtitle="Pick a type. You can change it before you publish."
      onBack={onBack}
    >
      <div className="grid gap-3">
        {LISTING_KIND_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`dm-focus rounded-2xl border border-border border-l-4 bg-surface p-4 text-left transition-colors hover:bg-surface-subtle ${ACCENT[opt.value]} ${
                active ? "ring-2 ring-accent/40" : ""
              }`}
            >
              <ListingTypeTag kind={opt.value} />
              <span className="mt-2 block text-sm font-semibold text-foreground">{opt.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}
