import { type NextRequest, NextResponse } from "next/server";

import { forbidCrossOrigin } from "@/lib/http/sameOrigin";

const isProduction = process.env.NODE_ENV === "production";

const cookieBase = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
};

function isPlausibleJwt(token: string): boolean {
  if (token.length < 20 || token.length > 4096) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export async function POST(req: NextRequest) {
  const blocked = forbidCrossOrigin(req);
  if (blocked) return blocked;

  let body: { access_token?: unknown; refresh_token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const access = typeof body.access_token === "string" ? body.access_token : "";
  const refresh = typeof body.refresh_token === "string" ? body.refresh_token : "";
  if (!isPlausibleJwt(access)) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const res = NextResponse.json({ status: "ok" });
  res.cookies.set("midora_access", access, {
    ...cookieBase,
    path: "/",
    maxAge: 15 * 60,
  });
  if (refresh && isPlausibleJwt(refresh)) {
    res.cookies.set("midora_refresh", refresh, {
      ...cookieBase,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return res;
}
