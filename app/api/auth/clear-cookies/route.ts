import { NextResponse } from "next/server";

export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ status: "ok" });

  // Clear the Next.js-domain cookies that /api/auth/set-cookies created.
  // Use matching attributes (path, secure, sameSite) so the browser
  // recognises them as the same cookie and removes them.
  res.cookies.set("midora_access", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("midora_refresh", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/v1/auth",
    maxAge: 0,
  });

  return res;
}
