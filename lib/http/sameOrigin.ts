import { NextResponse } from "next/server";

/** Reject cross-site POSTs that would ride HttpOnly cookies. */
export function forbidCrossOrigin(req: Request): NextResponse | null {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");

  if (site === "same-origin" || site === "none") return null;
  if (origin && origin === url.origin) return null;
  if (!origin && !site && process.env.NODE_ENV !== "production") return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
