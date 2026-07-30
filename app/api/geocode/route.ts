/**
 * Nominatim (OpenStreetMap) proxy for Midora.
 *
 * Why proxy (not call nominatim.openstreetmap.org from the browser):
 * - Policy requires an identifying User-Agent (browser forbids setting it).
 * - Hard ~1 req/s limit across the whole app — enforced server-side.
 * - Caching collapses duplicate autocomplete / Near me lookups.
 *
 * Same data source as LocationInput historically used.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOMINATIM_BASE = (
  process.env.NOMINATIM_BASE_URL?.replace(/\/$/, "") ||
  "https://nominatim.openstreetmap.org"
);
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "MidoraOnline/1.0 (https://www.midoraonline.com; midoraonline@gmail.com)";
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 400;

type CacheEntry = { body: unknown; status: number; savedAt: number };

const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;
let chain: Promise<void> = Promise.resolve();

function getCached(key: string): CacheEntry | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.savedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit;
}

function setCached(key: string, body: unknown, status: number) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { body, status, savedAt: Date.now() });
}

async function throttledFetch(url: string): Promise<Response> {
  const run = async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      // Nominatim asks not to hammer; we always revalidate via our own TTL cache.
      cache: "no-store",
    });
  };

  const next = chain.then(run, run);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const limitRaw = Number(searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(10, Math.max(1, Math.floor(limitRaw)))
    : 5;

  let upstreamPath: string;
  let cacheKey: string;

  if (lat != null && lon != null && lat !== "" && lon !== "") {
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
    }
    if (latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      return NextResponse.json({ error: "lat/lon out of range" }, { status: 400 });
    }
    const params = new URLSearchParams({
      lat: String(latN),
      lon: String(lonN),
      format: "json",
      addressdetails: "1",
      "accept-language": "en",
      zoom: "14",
    });
    upstreamPath = `/reverse?${params.toString()}`;
    cacheKey = `rev:${latN.toFixed(4)},${lonN.toFixed(4)}`;
  } else if (q.length >= 2) {
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: String(limit),
      countrycodes: "ug",
      "accept-language": "en",
      addressdetails: "0",
    });
    upstreamPath = `/search?${params.toString()}`;
    cacheKey = `search:${q.toLowerCase()}:${limit}`;
  } else {
    return NextResponse.json(
      { error: "Provide q=… (search) or lat=&lon= (reverse)" },
      { status: 400 },
    );
  }

  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached.body, { status: cached.status });
  }

  try {
    const upstream = await throttledFetch(`${NOMINATIM_BASE}${upstreamPath}`);
    const text = await upstream.text();
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { error: "Invalid upstream response" };
    }
    const status = upstream.ok ? 200 : upstream.status === 429 ? 429 : 502;
    if (upstream.ok) setCached(cacheKey, body, status);
    return NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Geocoder unavailable" }, { status: 502 });
  }
}
