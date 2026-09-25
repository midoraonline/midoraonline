/** Query params shared by the home feed, product search, and latest feed. */

export type CatalogQuery = {
  category?: string | null;
  listing_type?: string | null;
  verified_only?: boolean;
  available?: boolean;
  min_price?: number | null;
  max_price?: number | null;
  min_rating?: number | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  opportunity_kind?: string | null;
  compensation?: string | null;
  pricing_model?: string | null;
  /** Omit or "relevance" to use the API default. */
  sort?: string | null;
};

function setText(params: URLSearchParams, key: string, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) params.set(key, trimmed);
}

function setNum(params: URLSearchParams, key: string, value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return;
  params.set(key, String(value));
}

/** Append only the constraints the caller actually set. */
export function appendCatalogParams(
  params: URLSearchParams,
  query: CatalogQuery | null | undefined,
) {
  if (!query) return;
  setText(params, "category", query.category);
  setText(params, "listing_type", query.listing_type);
  if (query.verified_only) params.set("verified_only", "true");
  if (query.available) params.set("available", "true");
  setNum(params, "min_price", query.min_price);
  setNum(params, "max_price", query.max_price);
  setNum(params, "min_rating", query.min_rating);
  if (query.lat != null && query.lng != null) {
    params.set("lat", String(query.lat));
    params.set("lng", String(query.lng));
    setNum(params, "radius_km", query.radius_km);
  } else {
    setText(params, "location", query.location);
  }
  setText(params, "opportunity_kind", query.opportunity_kind);
  setText(params, "compensation", query.compensation);
  setText(params, "pricing_model", query.pricing_model);
  if (query.sort && query.sort !== "relevance") params.set("sort", query.sort);
}

export function catalogQueryKey(query: CatalogQuery | null | undefined): string {
  const params = new URLSearchParams();
  appendCatalogParams(params, query);
  params.sort();
  return params.toString();
}

export function catalogQueryActive(query: CatalogQuery | null | undefined): boolean {
  return catalogQueryKey(query).length > 0;
}
