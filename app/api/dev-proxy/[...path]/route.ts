/**
 * Universal API proxy — forwards all /api/v1/* calls to the FastAPI backend.
 *
 * WHY THIS EXISTS:
 * On Vercel (serverless), the FastAPI backend is on a different domain, so the
 * `midora_access` cookie (set by FastAPI) is scoped to the FastAPI domain.
 * Next.js SSR at the frontend domain cannot read it via `next/headers`,
 * breaking personalization.
 *
 * By routing ALL browser API calls through this proxy, cookies are:
 *   1. Set on the Next.js domain (Set-Cookie Domain= is stripped)
 *   2. Sent to Next.js on every request (same-origin)
 *   3. Readable by SSR via `next/headers`
 *   4. Forwarded to FastAPI as-is
 *
 * This also eliminates CORS issues entirely.
 */
import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function proxy(req: NextRequest): Promise<NextResponse> {
  const incoming = req.nextUrl.pathname.replace(/^\/api\/dev-proxy/, "");
  const search = req.nextUrl.search ?? "";
  const target = `${API_BASE}${incoming}${search}`;

  const reqHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    reqHeaders.set(key, value);
  });

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: reqHeaders,
      body,
      // @ts-expect-error — Node 18 fetch supports duplex
      duplex: body ? "half" : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream unreachable" },
      { status: 502 },
    );
  }

  const resBody = upstream.status === 204 ? null : await upstream.arrayBuffer();
  const res = new NextResponse(resBody, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Rewrite Set-Cookie: always strip Domain= so cookies bind to Next.js's domain.
  // Strip Secure in dev (localhost HTTP); keep in production (Vercel HTTPS).
  const isHttps = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      let localCookie = value.replace(/;\s*domain=[^;,]*/gi, "");
      if (!isHttps) localCookie = localCookie.replace(/;\s*secure(?=;|,|$)/gi, "");
      res.headers.append("set-cookie", localCookie);
    } else if (key.toLowerCase() !== "content-encoding") {
      res.headers.set(key, value);
    }
  });

  return res;
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
