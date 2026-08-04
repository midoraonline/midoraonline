import { NextResponse, type NextRequest } from "next/server";

const PERSONAL_BROWSER_CACHE =
  "private, max-age=300, stale-while-revalidate=60";

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Cache-Control", PERSONAL_BROWSER_CACHE);
  res.headers.set("Vary", "Cookie");
  return res;
}

export const config = {
  matcher: [
    "/",
    "/products",
    "/products/:path*",
    "/shops",
    "/shops/:path*",
  ],
};
