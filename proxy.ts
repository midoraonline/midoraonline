import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/safeNext";

const PERSONAL_BROWSER_CACHE =
  "private, max-age=300, stale-while-revalidate=60";

const PROTECTED_PREFIXES = ["/admin", "/merchant", "/customer", "/chat"];
const AUTH_PAGES = ["/login", "/register"];
const CATALOG_PREFIXES = ["/", "/products", "/shops"];
const ACCESS_COOKIE = "midora_access";
const REFRESH_COOKIE = "midora_refresh";
const SESSION_COOKIE = "midora_session_id";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const REFRESH_TIMEOUT_MS = 6_000;
const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

type Refreshed = { access: string; refresh: string } | "invalid" | null;

function isPrefetch(req: NextRequest): boolean {
  return (
    req.headers.has("next-router-prefetch") ||
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("sec-purpose")?.includes("prefetch") === true
  );
}

async function refreshSession(req: NextRequest, refreshToken: string): Promise<Refreshed> {
  if (!API_BASE) return null;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  const ua = req.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
    if (res.status === 401) return "invalid";
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; refresh_token?: string };
    if (!data.access_token || !data.refresh_token) return null;
    return { access: data.access_token, refresh: data.refresh_token };
  } catch {
    return null;
  }
}

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("midora_access")?.value ||
      req.cookies.get("midora_refresh")?.value,
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isCatalogPath(pathname: string): boolean {
  return CATALOG_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== "/" && pathname.startsWith(`${prefix}/`)),
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  let refreshed: Refreshed = null;
  if (refreshToken && !req.cookies.get(ACCESS_COOKIE)?.value && !isPrefetch(req)) {
    refreshed = await refreshSession(req, refreshToken);
    if (refreshed && refreshed !== "invalid") {
      req.cookies.set(ACCESS_COOKIE, refreshed.access);
      req.cookies.set(REFRESH_COOKIE, refreshed.refresh);
    } else if (refreshed === "invalid") {
      req.cookies.delete(REFRESH_COOKIE);
    }
  }

  const newSessionId = req.cookies.get(SESSION_COOKIE)?.value ? null : crypto.randomUUID();
  if (newSessionId) req.cookies.set(SESSION_COOKIE, newSessionId);

  const withCookies = (res: NextResponse) => {
    if (newSessionId) {
      res.cookies.set(SESSION_COOKIE, newSessionId, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 });
    }
    if (refreshed === "invalid") {
      res.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
    } else if (refreshed) {
      res.cookies.set(ACCESS_COOKIE, refreshed.access, { ...cookieBase, maxAge: 15 * 60 });
      res.cookies.set(REFRESH_COOKIE, refreshed.refresh, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 });
    }
    return res;
  };

  const signedIn = hasSessionCookie(req);

  if (isProtected(pathname) && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return withCookies(NextResponse.redirect(url));
  }

  if (AUTH_PAGES.includes(pathname) && req.cookies.get(ACCESS_COOKIE)?.value) {
    const dest = safeNextPath(req.nextUrl.searchParams.get("next")) || "/";
    const url = req.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    return withCookies(NextResponse.redirect(url));
  }

  const res = refreshed || newSessionId ? NextResponse.next({ request: { headers: req.headers } }) : NextResponse.next();
  if (isCatalogPath(pathname)) {
    res.headers.set("Cache-Control", PERSONAL_BROWSER_CACHE);
    res.headers.set("Vary", "Cookie");
  }
  return withCookies(res);
}

export const config = {
  matcher: [
    "/",
    "/products",
    "/products/:path*",
    "/shops",
    "/shops/:path*",
    "/admin",
    "/admin/:path*",
    "/merchant",
    "/merchant/:path*",
    "/customer",
    "/customer/:path*",
    "/chat",
    "/chat/:path*",
    "/login",
    "/register",
  ],
};
