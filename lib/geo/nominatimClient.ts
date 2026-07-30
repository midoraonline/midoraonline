import type { GeocodeHit, LatLng } from "./types";
import { shortPlaceLabel } from "./ugandaPlaces";

type SearchApiItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

type ReverseApiItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
  };
};

function parseHit(item: SearchApiItem | ReverseApiItem | null | undefined): GeocodeHit | null {
  if (!item?.lat || !item?.lon) return null;
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    displayName: item.display_name?.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}

/**
 * Client for Midora's Nominatim proxy (`/api/geocode`).
 * Same OpenStreetMap stack as LocationInput, but production-safe (UA + rate limit + cache).
 */
export async function geocodeSearch(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    limit: String(opts?.limit ?? 5),
  });
  const res = await fetch(`/api/geocode?${params.toString()}`, {
    signal: opts?.signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SearchApiItem[] | { error?: string };
  if (!Array.isArray(data)) return [];
  return data.map(parseHit).filter((h): h is GeocodeHit => Boolean(h));
}

export async function geocodeFirst(
  query: string,
  opts?: { signal?: AbortSignal },
): Promise<GeocodeHit | null> {
  const hits = await geocodeSearch(query, { ...opts, limit: 1 });
  return hits[0] ?? null;
}

export async function reverseGeocode(
  coords: LatLng,
  opts?: { signal?: AbortSignal },
): Promise<GeocodeHit | null> {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lng),
  });
  const res = await fetch(`/api/geocode?${params.toString()}`, {
    signal: opts?.signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ReverseApiItem | { error?: string };
  if (!data || typeof data !== "object" || "error" in data) return null;
  return parseHit(data as ReverseApiItem);
}

/** Prefer city/town from reverse payload for chip text. */
export function labelFromReverse(hit: GeocodeHit | null, fallback = "Near me"): string {
  if (!hit) return fallback;
  return shortPlaceLabel(hit.displayName, fallback);
}

/** Display names only (for LocationInput migration). */
export async function searchPlaceNames(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<string[]> {
  const hits = await geocodeSearch(query, opts);
  return hits.map((h) => h.displayName);
}
