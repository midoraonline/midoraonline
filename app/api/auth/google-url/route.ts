import { NextResponse } from "next/server";

/**
 * Proxy for GET /api/v1/auth/google/url
 *
 * The production backend has CORS configured for the production domain only,
 * so browser fetches from localhost are blocked. This server-side proxy
 * forwards the request from Next.js (server → backend, no CORS) so local
 * development works without touching the backend CORS config.
 */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${base}/api/v1/auth/google/url`, {
      headers: { Accept: "application/json" },
      // server-to-server — no credentials needed here
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach auth service" },
      { status: 502 },
    );
  }
}
