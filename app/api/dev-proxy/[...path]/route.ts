/**
 * Dev-only proxy — forwards all /api/v1/* calls to the production backend
 * and rewrites Set-Cookie headers so they work on localhost (strips Domain=
 * and Secure flags that the browser would otherwise reject for http://localhost).
 *
 * Only reachable in development because production uses direct fetch calls.
 */
import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function proxy(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reconstruct the upstream path: /api/dev-proxy/api/v1/... → /api/v1/...
  const incoming = req.nextUrl.pathname.replace(/^\/api\/dev-proxy/, "");
  const search = req.nextUrl.search ?? "";
  const target = `${API_BASE}${incoming}${search}`;

  // Forward request headers, drop host so the upstream sees its own domain
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

  // Build response — stream the body through
  const resBody = upstream.status === 204 ? null : await upstream.arrayBuffer();
  const res = new NextResponse(resBody, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Copy response headers; rewrite Set-Cookie so cookies stick on localhost
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const localCookie = value
        .replace(/;\s*domain=[^;,]*/gi, "")   // remove Domain= attribute
        .replace(/;\s*secure(?=;|,|$)/gi, "")  // remove Secure flag
        .replace(/;\s*samesite=none/gi, "; SameSite=Lax"); // Lax works on http
      res.headers.append("set-cookie", localCookie);
    } else if (key.toLowerCase() !== "content-encoding") {
      // skip content-encoding — body is already decoded by fetch
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
