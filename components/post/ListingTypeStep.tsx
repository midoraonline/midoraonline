"use client";

import type { IconType } from "react-icons";
import { PiBriefcaseFill, PiCheckCircleFill, PiPackageFill, PiSparkleFill, PiWrenchFill } from "react-icons/pi";
import StepFrame from "@/components/post/StepFrame";
import { LISTING_KIND_OPTIONS, type ListingKind } from "@/lib/listingMeta";

const TILE: Record<string, { icon: IconType; chip: string; hint: string }> = {
  product: {
    icon: PiPackageFill,
    chip: "bg-listing-product text-listing-product-foreground",
    hint: "Goods for sale, new or used.",
  },
  service: {
    icon: PiWrenchFill,
    chip: "bg-listing-service text-listing-service-foreground",
    hint: "Work you do for clients.",
  },
  opportunity: {
    icon: PiBriefcaseFill,
    chip: "bg-listing-opportunity text-listing-opportunity-foreground",
    hint: "Jobs, gigs and other openings.",
  },
};
const FALLBACK = { icon: PiSparkleFill, chip: "bg-accent/10 text-accent", hint: "" };

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {LISTING_KIND_OPTIONS.map((opt) => {
          const t = TILE[opt.value] ?? FALLBACK;
          const on = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={on}
              className={`dm-focus group relative flex h-24 items-center gap-4 rounded-xl border-2 bg-surface px-4 text-left shadow-xs transition-colors sm:h-44 sm:flex-col sm:items-start sm:justify-between sm:p-5 ${
                on ? "border-accent bg-accent/[0.04]" : "border-border hover:border-accent/50"
              }`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${t.chip}`} aria-hidden>
                <t.icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1 sm:flex-none">
                <span className="block text-base font-semibold text-foreground">{opt.label}</span>
                <span className="mt-0.5 block truncate text-sm text-muted sm:whitespace-normal">{t.hint}</span>
              </span>
              <span
                className={`absolute right-3 top-3 transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                aria-hidden
              >
                <PiCheckCircleFill className="size-5 text-accent" />
              </span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}
