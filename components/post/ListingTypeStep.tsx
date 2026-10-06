"use client";

import ListingTypeTag from "@/components/ListingTypeTag";
import { ArrowRight, Package, Sparkles, Wrench } from "lucide-react";
import StepFrame from "@/components/post/StepFrame";
import { LISTING_KIND_OPTIONS, type ListingKind } from "@/lib/listingMeta";

const STYLE: Record<ListingKind, { accent: string; icon: string; ring: string }> = {
  product: {
    accent: "border-listing-product-accent",
    icon: "bg-listing-product text-listing-product-foreground",
    ring: "ring-listing-product-accent",
  },
  service: {
    accent: "border-listing-service-accent",
    icon: "bg-listing-service text-listing-service-foreground",
    ring: "ring-listing-service-accent",
  },
  opportunity: {
    accent: "border-listing-opportunity-accent",
    icon: "bg-listing-opportunity text-listing-opportunity-foreground",
    ring: "ring-listing-opportunity-accent",
  },
};

const ICON = {
  product: Package,
  service: Wrench,
  opportunity: Sparkles,
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
      wide
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {LISTING_KIND_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          const Icon = ICON[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`dm-focus group flex min-h-48 flex-col justify-between gap-5 rounded-xl border-2 border-border-strong border-t-4 bg-surface p-4 text-left shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg lg:min-h-64 lg:gap-6 lg:p-6 ${STYLE[opt.value].accent} ${
                active ? `bg-surface-subtle ring-2 ${STYLE[opt.value].ring}` : ""
              }`}
            >
              <span className="flex items-start justify-between gap-4">
                <span className={`grid size-12 place-items-center rounded-xl lg:size-14 ${STYLE[opt.value].icon}`}>
                  <Icon className="size-6 lg:size-7" aria-hidden />
                </span>
                <ListingTypeTag
                  kind={opt.value}
                  className="px-3 py-1.5 text-xs font-bold"
                />
              </span>
              <span>
                <span className="block text-lg font-bold text-foreground lg:text-xl">{opt.label}</span>
                <span className="mt-2 block text-sm font-medium leading-relaxed text-foreground/80 lg:text-base">
                  {opt.hint}
                </span>
              </span>
              <span className="flex items-center justify-between border-t-2 border-border pt-4 text-sm font-bold text-foreground">
                Choose {opt.label.toLowerCase()}
                <ArrowRight className="size-5 text-accent transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}
