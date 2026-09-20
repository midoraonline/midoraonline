import { NextResponse } from "next/server";

import { forbidCrossOrigin } from "@/lib/http/sameOrigin";

export async function POST(req: Request) {
  const blocked = forbidCrossOrigin(req);
  if (blocked) return blocked;

  const isProduction = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ status: "ok" });
  const base = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 0,
  };

  res.cookies.set("midora_access", "", { ...base, path: "/" });
  for (const path of ["/", "/api/v1/auth", "/api/dev-proxy/api/v1/auth"]) {
    res.cookies.set("midora_refresh", "", { ...base, path });
  }
  return res;
}
