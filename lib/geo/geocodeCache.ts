import type { GeocodeHit } from "./types";
import { normalizePlaceQuery } from "./ugandaPlaces";

const CACHE_PREFIX = "midora:geocode:v1:";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type CacheEntry = {
  hit: GeocodeHit | null;
  savedAt: number;
};

function cacheKey(query: string): string {
  return `${CACHE_PREFIX}${normalizePlaceQuery(query)}`;
}

export function readGeocodeCache(query: string): GeocodeHit | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(cacheKey(query));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || typeof entry.savedAt !== "number") return undefined;
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(query));
      return undefined;
    }
    return entry.hit;
  } catch {
    return undefined;
  }
}

export function writeGeocodeCache(query: string, hit: GeocodeHit | null): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { hit, savedAt: Date.now() };
    localStorage.setItem(cacheKey(query), JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}
