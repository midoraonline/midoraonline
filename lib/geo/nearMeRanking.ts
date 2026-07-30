import type { ProductCardData } from "@/components/productcard";
import { readGeocodeCache, writeGeocodeCache } from "./geocodeCache";
import { haversineKm } from "./haversine";
import { geocodeFirst } from "./nominatimClient";
import type { LatLng } from "./types";
import { resolveUgandaPlaceCoords } from "./ugandaPlaces";

const MAX_NOMINATIM_LOOKUPS_PER_PASS = 6;

export function productPlaceLabel(p: ProductCardData): string | null {
  const loc = p.location_name?.trim() || p.shop.location?.trim() || null;
  return loc || null;
}

/** Prefer stored shop lat/lng from the feed; fall back to place-string resolution. */
export function productStoredCoords(p: ProductCardData): LatLng | null {
  const lat = p.shop.lat;
  const lng = p.shop.lng;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return { lat, lng };
  }
  return null;
}

/**
 * Resolve place string → coords: Uganda seed → localStorage cache → Nominatim (limited).
 */
export async function resolvePlaceCoords(
  place: string,
  opts?: { allowNetwork?: boolean; signal?: AbortSignal },
): Promise<LatLng | null> {
  const seeded = resolveUgandaPlaceCoords(place);
  if (seeded) return seeded;

  const cached = readGeocodeCache(place);
  if (cached !== undefined) {
    return cached ? { lat: cached.lat, lng: cached.lng } : null;
  }

  if (opts?.allowNetwork === false) return null;

  const hit = await geocodeFirst(place, { signal: opts?.signal });
  writeGeocodeCache(place, hit);
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}

export type DistanceMapBuildResult = {
  /** productId → km (Infinity omitted; missing = unknown) */
  distances: Map<string, number>;
  /** How many unique places still need network geocode */
  pendingNetwork: number;
};

/**
 * Build distance-from-user map for the current product cards.
 * Prefers shop.location lat/lng from the API when present.
 */
export async function buildNearMeDistanceMap(
  products: ProductCardData[],
  user: LatLng,
  opts?: { allowNetwork?: boolean; signal?: AbortSignal },
): Promise<DistanceMapBuildResult> {
  const placeByProduct = new Map<string, string>();
  const uniquePlaces = new Set<string>();
  const distances = new Map<string, number>();

  for (const p of products) {
    const stored = productStoredCoords(p);
    if (stored) {
      distances.set(p.id, haversineKm(user, stored));
      continue;
    }
    const place = productPlaceLabel(p);
    if (!place) continue;
    placeByProduct.set(p.id, place);
    uniquePlaces.add(place);
  }

  const coordsByPlace = new Map<string, LatLng | null>();
  const needNetwork: string[] = [];

  for (const place of uniquePlaces) {
    const seeded = resolveUgandaPlaceCoords(place);
    if (seeded) {
      coordsByPlace.set(place, seeded);
      continue;
    }
    const cached = readGeocodeCache(place);
    if (cached !== undefined) {
      coordsByPlace.set(place, cached ? { lat: cached.lat, lng: cached.lng } : null);
      continue;
    }
    needNetwork.push(place);
  }

  if (opts?.allowNetwork !== false && needNetwork.length > 0) {
    const batch = needNetwork.slice(0, MAX_NOMINATIM_LOOKUPS_PER_PASS);
    for (const place of batch) {
      if (opts?.signal?.aborted) break;
      try {
        const hit = await geocodeFirst(place, { signal: opts?.signal });
        writeGeocodeCache(place, hit);
        coordsByPlace.set(place, hit ? { lat: hit.lat, lng: hit.lng } : null);
      } catch {
        coordsByPlace.set(place, null);
      }
    }
  }

  for (const [productId, place] of placeByProduct) {
    const coords = coordsByPlace.get(place);
    if (!coords) continue;
    distances.set(productId, haversineKm(user, coords));
  }

  const stillPending = needNetwork.filter((p) => !coordsByPlace.has(p)).length;

  return { distances, pendingNetwork: stillPending };
}
