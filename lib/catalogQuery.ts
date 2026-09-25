import type { FilterState } from "@/components/browse/ProductFilters";
import type { CatalogQuery } from "@/lib/api/catalogFilters";

/** Map the browse filter sheet onto the catalog query contract. */
export function toCatalogQuery(
  filters: FilterState,
  category?: string | null,
): CatalogQuery {
  const near = Boolean(filters.nearMe && filters.userGeo);
  return {
    category,
    listing_type: filters.listingKind,
    verified_only: filters.verifiedOnly,
    available: filters.availableNow,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    min_rating: filters.minRating,
    location: near ? null : filters.location,
    lat: near ? filters.userGeo!.lat : null,
    lng: near ? filters.userGeo!.lng : null,
    opportunity_kind: filters.opportunityKind,
    compensation: filters.compensation,
    pricing_model: filters.pricingModel,
    sort: filters.sort,
  };
}
