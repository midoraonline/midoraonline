import { NextResponse, type NextRequest } from "next/server";

const PERSONAL_BROWSER_CACHE =
  "private, max-age=300, stale-while-revalidate=60";

const PROTECTED_PREFIXES = ["/admin", "/merchant", "/customer", "/chat"];
const AUTH_PAGES = ["/login", "/register"];
const CATALOG_PREFIXES = ["/", "/products", "/shops"];

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

function safeInternalPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function isCatalogPath(pathname: string): boolean {
  return CATALOG_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== "/" && pathname.startsWith(`${prefix}/`)),
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = hasSessionCookie(req);

  if (isProtected(pathname) && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && req.cookies.get("midora_access")?.value) {
    const dest = safeInternalPath(req.nextUrl.searchParams.get("next")) || "/";
    const url = req.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  if (isCatalogPath(pathname)) {
    res.headers.set("Cache-Control", PERSONAL_BROWSER_CACHE);
    res.headers.set("Vary", "Cookie");
  }
  return res;
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
