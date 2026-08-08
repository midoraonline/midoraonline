import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

// Reused across invocations on Vercel (module scope is cached per container).
const utapi = new UTApi();

/**
 * Extract the UploadThing file key from a CDN URL.
 * Handles: https://<region>.ufs.sh/f/<key> and https://utfs.io/f/<key>
 * Strips any query/fragment (e.g. our `#midora-video` tag).
 */
function extractFileKey(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== "utfs.io" && !host.endsWith(".ufs.sh")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // Expected path: /f/<key>
    const idx = parts.indexOf("f");
    const key = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
    return key || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/uploadthing/delete
 * Body: { urls: string[] }  (or { keys: string[] })
 *
 * Auth: requires a Bearer token so anonymous callers can't wipe files.
 * Anything that isn't a valid UploadThing URL is silently ignored — the
 * merchant modal happily calls us with mixed http URLs and we shouldn't
 * error out just because one entry isn't ours.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ") || !auth.slice(7).trim()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { urls?: unknown; keys?: unknown };
  try {
    payload = (await req.json()) as { urls?: unknown; keys?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const urls: string[] = Array.isArray(payload.urls)
    ? payload.urls.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];
  const rawKeys: string[] = Array.isArray(payload.keys)
    ? payload.keys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : [];

  const derivedKeys = urls
    .map((u) => extractFileKey(u))
    .filter((k): k is string => Boolean(k));
  const keys = Array.from(new Set([...rawKeys, ...derivedKeys]));

  if (keys.length === 0) {
    return NextResponse.json({ deleted: 0, skipped: urls.length });
  }

  try {
    const result = await utapi.deleteFiles(keys);
    return NextResponse.json({
      deleted: keys.length,
      success: result?.success ?? true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 500 },
    );
  }
}
