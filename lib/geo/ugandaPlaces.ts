import type { LatLng } from "./types";

/**
 * Coarse centroids for common Uganda places.
 * Used first so Near me can rank without hammering Nominatim for every listing.
 * Keys are lowercase substrings matched against product/shop location strings.
 */
const UG_PLACE_COORDS: Record<string, LatLng> = {
  kampala: { lat: 0.3476, lng: 32.5825 },
  entebbe: { lat: 0.0512, lng: 32.4637 },
  jinja: { lat: 0.4319, lng: 33.2109 },
  gulu: { lat: 2.7746, lng: 32.299 },
  mbarara: { lat: -0.6072, lng: 30.6545 },
  mbale: { lat: 1.0823, lng: 34.175 },
  "fort portal": { lat: 0.671, lng: 30.275 },
  fortportal: { lat: 0.671, lng: 30.275 },
  masaka: { lat: -0.3411, lng: 31.7361 },
  lira: { lat: 2.249, lng: 32.8998 },
  arua: { lat: 3.0201, lng: 30.9111 },
  soroti: { lat: 1.7145, lng: 33.6111 },
  kabale: { lat: -1.2486, lng: 29.9899 },
  hoima: { lat: 1.4356, lng: 31.3436 },
  mukono: { lat: 0.3533, lng: 32.7553 },
  wakiso: { lat: 0.4043, lng: 32.459 },
  kisasi: { lat: 0.362, lng: 32.605 },
  ntinda: { lat: 0.341, lng: 32.615 },
  nakawa: { lat: 0.333, lng: 32.62 },
  kololo: { lat: 0.333, lng: 32.595 },
  bugolobi: { lat: 0.31, lng: 32.62 },
  makindye: { lat: 0.28, lng: 32.58 },
  kawempe: { lat: 0.39, lng: 32.56 },
  rubaga: { lat: 0.3, lng: 32.55 },
  "wandegeya": { lat: 0.335, lng: 32.575 },
  najjera: { lat: 0.38, lng: 32.63 },
  kira: { lat: 0.4, lng: 32.64 },
  nansana: { lat: 0.375, lng: 32.53 },
  lugazi: { lat: 0.37, lng: 32.94 },
  iganga: { lat: 0.6092, lng: 33.4686 },
  tororo: { lat: 0.693, lng: 34.181 },
  busia: { lat: 0.4659, lng: 34.092 },
  kitgum: { lat: 3.2783, lng: 32.8867 },
  moroto: { lat: 2.535, lng: 34.666 },
  mityana: { lat: 0.4175, lng: 32.0228 },
  mubende: { lat: 0.5605, lng: 31.39 },
  kasese: { lat: 0.1833, lng: 30.0833 },
  ishingiro: { lat: -0.75, lng: 30.8 },
  bushenyi: { lat: -0.5853, lng: 30.2114 },
  rukungiri: { lat: -0.8411, lng: 29.9419 },
  kisoro: { lat: -1.285, lng: 29.685 },
  "online shop": { lat: 0.3476, lng: 32.5825 },
};

/** Longest-key-first so "fort portal" wins over partial noise. */
const SORTED_KEYS = Object.keys(UG_PLACE_COORDS).sort(
  (a, b) => b.length - a.length,
);

export function normalizePlaceQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/,+/g, ",");
}

/**
 * Resolve a listing/shop place string to coords via the Uganda seed table.
 * Matches substrings (Nominatim display names include city/district).
 */
export function resolveUgandaPlaceCoords(place: string): LatLng | null {
  const q = normalizePlaceQuery(place);
  if (!q || q === "online shop") return null;

  for (const key of SORTED_KEYS) {
    if (key === "online shop") continue;
    if (q === key || q.includes(key)) {
      return UG_PLACE_COORDS[key] ?? null;
    }
  }
  return null;
}

/** Short chip label from a reverse-geocode display name. */
export function shortPlaceLabel(displayName: string, fallback = "Near me"): string {
  const first = displayName.split(",")[0]?.trim();
  if (!first) return fallback;
  return first.length > 28 ? `${first.slice(0, 26)}…` : first;
}
