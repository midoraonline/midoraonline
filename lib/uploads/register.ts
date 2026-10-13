
export type UploadKind =
  | "listingPhoto"
  | "shopLogo"
  | "shopBanner"
  | "verificationDoc"
  | "avatar"
  | "productVideo";

/**
 * Record who uploaded a file so the API can later delete it safely
 * (owner-only, unused-only). Best effort: a failed record never fails the upload;
 * the file just isn't discardable by the user and stays until an admin cleans up.
 */
export async function registerUpload(input: {
  key: string;
  url: string;
  userId: string;
  kind: UploadKind;
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return;
  try {
    await fetch(`${base}/api/v1/media/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Media-Secret": process.env.MEDIA_REGISTER_SECRET ?? "",
      },
      body: JSON.stringify({
        key: input.key,
        url: input.url,
        user_id: input.userId,
        kind: input.kind,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn("[uploadthing] could not record upload", input.key, err);
  }
}
