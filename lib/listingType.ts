import type { ListingMeta } from "@/lib/listingMeta";

/** Public type chip. Job stays its own chip when the listing is a job. */
export type ListingTypeTagKind = "product" | "service" | "opportunity" | "job";

export const LISTING_TYPE_LABEL: Record<ListingTypeTagKind, string> = {
  product: "Product",
  service: "Service",
  opportunity: "Opportunity",
  job: "Job",
};

export function listingTypeTagKind(
  itemType?: string | null,
  meta?: Pick<ListingMeta, "opportunity_kind"> | null,
): ListingTypeTagKind {
  const t = (itemType ?? "product").toLowerCase();
  if (t === "service") return "service";
  if (t === "job") return "job";
  if (t === "opportunity") {
    return meta?.opportunity_kind === "job" ? "job" : "opportunity";
  }
  return "product";
}
