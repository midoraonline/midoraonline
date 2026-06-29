import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ status: "ok" });

  res.cookies.set("midora_access", access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60, // 15 min
  });

  if (refresh_token) {
    res.cookies.set("midora_refresh", refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/api/v1/auth",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return res;
}
