import { LISTING_TYPE_LABEL, type ListingTypeTagKind } from "@/lib/listingType";

const TONE: Record<ListingTypeTagKind, string> = {
  product: "bg-listing-product text-listing-product-foreground",
  service: "bg-listing-service text-listing-service-foreground",
  opportunity: "bg-listing-opportunity text-listing-opportunity-foreground",
  job: "bg-listing-job text-listing-job-foreground",
};

/** Small listing-type chip. Same component on feed cards, forms, and detail. */
export default function ListingTypeTag({ kind }: { kind: ListingTypeTagKind }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${TONE[kind]}`}
    >
      {LISTING_TYPE_LABEL[kind]}
    </span>
  );
}
