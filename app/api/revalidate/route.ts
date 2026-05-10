/**
 * On-demand cache revalidation endpoint.
 *
 * Usage (from FastAPI or any trusted server):
 *   POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=<TAG>
 *
 * Valid tags: "shops" | "products" | "most-viewed"
 *
 * Set REVALIDATE_SECRET in Vercel environment variables and in the FastAPI
 * backend's environment so it can call this endpoint after mutations.
 *
 * Example FastAPI usage (httpx):
 *   await httpx.post(
 *     f"{NEXT_PUBLIC_URL}/api/revalidate",
 *     params={"secret": REVALIDATE_SECRET, "tag": "products"},
 *   )
 */
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { CACHE_TAGS, type CacheTag } from "@/lib/cache";

const VALID_TAGS = new Set<string>(Object.values(CACHE_TAGS));

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret" }, { status: 401 });
  }

  const tag = request.nextUrl.searchParams.get("tag");
  if (!tag || !VALID_TAGS.has(tag)) {
    return NextResponse.json(
      { error: `Missing or unknown tag. Valid tags: ${[...VALID_TAGS].join(", ")}` },
      { status: 400 },
    );
  }

  // Pass "max" as the profile (required by Next.js 16 type signature).
  // This revalidates across all cache profiles; works for unstable_cache-tagged
  // entries and the newer "use cache" entries alike.
  revalidateTag(tag as CacheTag, "max");

  return NextResponse.json({ revalidated: true, tag });
}
