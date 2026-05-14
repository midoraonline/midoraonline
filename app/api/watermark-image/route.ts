import { NextRequest, NextResponse } from "next/server";

import { isAllowedLogoDownloadUrl } from "@/lib/watermark/allowlist";
import { compositeShopLogoWatermark } from "@/lib/watermark/composite";

export const runtime = "nodejs";
/** Allow headroom for Sharp + logo fetch on large photos (Vercel). */
export const maxDuration = 30;

/** Match UploadThing product image cap. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function verifyBearer(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return false;
  try {
    const r = await fetch(`${base}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyBearer(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const logoUrlRaw = form.get("logoUrl");

  if (!(file instanceof File) || typeof logoUrlRaw !== "string") {
    return NextResponse.json({ error: "file and logoUrl are required" }, { status: 400 });
  }

  const logoUrl = logoUrlRaw.trim();
  if (!logoUrl || !isAllowedLogoDownloadUrl(logoUrl)) {
    return NextResponse.json({ error: "Invalid logoUrl" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const mime = file.type || "";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "file must be an image" }, { status: 400 });
  }

  const imageBuffer = Buffer.from(await file.arrayBuffer());

  let logoBuffer: Buffer;
  try {
    const lr = await fetch(logoUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!lr.ok) {
      return NextResponse.json({ error: "Could not download logo" }, { status: 400 });
    }
    const ct = lr.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ error: "Logo URL is not an image" }, { status: 400 });
    }
    logoBuffer = Buffer.from(await lr.arrayBuffer());
    if (logoBuffer.length > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo too large" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not download logo" }, { status: 400 });
  }

  try {
    const out = await compositeShopLogoWatermark(imageBuffer, logoBuffer);
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[watermark-image]", e);
    return NextResponse.json({ error: "Watermark processing failed" }, { status: 500 });
  }
}
