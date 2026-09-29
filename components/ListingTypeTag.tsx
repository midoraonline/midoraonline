import { LISTING_TYPE_LABEL, type ListingTypeTagKind } from "@/lib/listingType";

/** Listing tags plus the shop filter chip, which is not a listing type. */
export type ListingTone = ListingTypeTagKind | "shop";

const TONE: Record<ListingTone, string> = {
  product: "bg-listing-product text-listing-product-foreground",
  service: "bg-listing-service text-listing-service-foreground",
  opportunity: "bg-listing-opportunity text-listing-opportunity-foreground",
  job: "bg-listing-job text-listing-job-foreground",
  shop: "bg-listing-shop text-listing-shop-foreground",
};

const RING: Record<ListingTone, string> = {
  product: "ring-listing-product-accent",
  service: "ring-listing-service-accent",
  opportunity: "ring-listing-opportunity-accent",
  job: "ring-listing-job-accent",
  shop: "ring-listing-shop-accent",
};

export function listingToneClass(kind: ListingTone) {
  return TONE[kind];
}

export function listingToneRing(kind: ListingTone) {
  return RING[kind];
}

/** Small listing-type chip. Same component on feed cards, forms, and detail. */
export default function ListingTypeTag({
  kind,
  label,
  className = "",
}: {
  kind: ListingTypeTagKind;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${TONE[kind]} ${className}`}
    >
      {label ?? LISTING_TYPE_LABEL[kind]}
    </span>
  );
}
