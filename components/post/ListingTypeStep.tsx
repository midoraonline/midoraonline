"use client";

import { Briefcase, Package, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import StepFrame from "@/components/post/StepFrame";
import { LISTING_KIND_OPTIONS, type ListingKind } from "@/lib/listingMeta";

const TILE: Record<string, { icon: LucideIcon; chip: string; ring: string }> = {
  product: {
    icon: Package,
    chip: "bg-listing-product text-listing-product-foreground",
    ring: "border-listing-product-accent ring-4 ring-listing-product-accent/15",
  },
  service: {
    icon: Wrench,
    chip: "bg-listing-service text-listing-service-foreground",
    ring: "border-listing-service-accent ring-4 ring-listing-service-accent/15",
  },
  opportunity: {
    icon: Briefcase,
    chip: "bg-listing-opportunity text-listing-opportunity-foreground",
    ring: "border-listing-opportunity-accent ring-4 ring-listing-opportunity-accent/15",
  },
};
const FALLBACK = { icon: Sparkles, chip: "bg-accent/10 text-accent", ring: "border-accent ring-4 ring-accent/10" };

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
    <StepFrame title="What are you posting?" subtitle="You can change this before you publish." onBack={onBack} wide plain>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LISTING_KIND_OPTIONS.map((opt) => {
          const t = TILE[opt.value] ?? FALLBACK;
          const on = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={on}
              className={`dm-focus flex min-h-16 items-center gap-3 rounded-xl border bg-surface p-4 text-left shadow-xs transition-colors sm:min-h-40 sm:flex-col sm:items-start sm:p-5 ${
                on ? t.ring : "border-border hover:border-border-strong"
              }`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.chip}`} aria-hidden>
                <t.icon className="size-5" />
              </span>
              <span className="min-w-0 sm:mt-3">
                <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}
