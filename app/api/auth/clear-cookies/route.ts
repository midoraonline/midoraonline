import { NextResponse } from "next/server";

import { forbidCrossOrigin } from "@/lib/http/sameOrigin";

/**
 * Clear Midora auth cookies on the Next.js host.
 * Cookies may have been set via `/api/auth/set-cookies` (SameSite=Lax) or
 * rewritten through `/api/dev-proxy` (also Lax). Older deploys may still have
 * SameSite=None; Secure may be on or off depending on HTTPS. Browsers only
 * delete a cookie when Path + SameSite + Secure match the stored cookie, so
 * we emit every plausible combination.
 */
export async function POST(req: Request) {
  const blocked = forbidCrossOrigin(req);
  if (blocked) return blocked;

  const res = NextResponse.json({ status: "ok" });
  const names = ["midora_access", "midora_refresh"] as const;
  const paths = ["/", "/api/v1/auth", "/api/dev-proxy/api/v1/auth"] as const;
  const sameSites = ["lax", "none", "strict"] as const;

  for (const name of names) {
    for (const path of paths) {
      for (const sameSite of sameSites) {
        for (const secure of [true, false]) {
          // SameSite=None requires Secure in modern browsers; still try both.
          res.cookies.set(name, "", {
            httpOnly: true,
            path,
            maxAge: 0,
            sameSite,
            secure,
          });
        }
      }
    }
  }

  return res;
}
