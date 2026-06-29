/**
 * Server-side secure feed proxy.
 *
 * WHY THIS EXISTS:
 * When Next.js Server Components call the FastAPI backend directly, the
 * `midora_access` cookie is readable via `next/headers` cookies() — but only
 * in the App Router request context. However, passing it via apiFetch as a
 * Bearer token is the correct approach. This route exists as a fallback for
 * cases where the cookie isn't forwarded (e.g. edge cases in Vercel routing).
 *
 * HOW IT WORKS:
 * 1. Reads `midora_access` from the incoming server-side cookie store
 * 2. Forwards it as an `Authorization: Bearer` header to FastAPI
 * 3. Returns the response as-is
 *
 * The client calls /api/feed?limit=72 and gets a personalized response.
 */
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("midora_access")?.value;

  const search = req.nextUrl.search ?? "";
  const upstreamUrl = `${API_BASE}/api/v1/feed/home${search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const upstream = await fetch(upstreamUrl, { headers, cache: "no-store" });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Feed unavailable", algorithm: [], trending: [], premium: [], fresh: [] },
      { status: 502 }
    );
  }
}
