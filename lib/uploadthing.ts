import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { apiFetch } from "@/lib/api/base";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

export async function getUploadThingAuthHeaders(): Promise<Record<string, string>> {
  try {
    const res = await apiFetch<{ access_token: string }>(
      "/api/v1/auth/upload-token",
      { method: "POST", body: {}, timeoutMs: 10_000 }
    );
    return res.access_token
      ? { Authorization: `Bearer ${res.access_token}` }
      : {};
  } catch {
    return {};
  }
}

/**
 * Delete one or more UploadThing files by their CDN URL.
 *
 * Fire-and-forget by default — never throws. UploadThing charges for
 * storage, so calling this when the user removes an image (or deletes a
 * listing) keeps the merchant's quota clean. Non-UploadThing URLs are
 * silently ignored by the server route.
 */
export async function deleteUploadThingFiles(urls: string[]): Promise<void> {
  const cleaned = Array.from(new Set((urls || []).filter(Boolean)));
  if (cleaned.length === 0) return;

  const headers = await getUploadThingAuthHeaders();
  if (!headers.Authorization) return; // no auth = can't call the route

  try {
    await fetch("/api/uploadthing/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ urls: cleaned }),
      // Best-effort; caller has already updated its own UI.
      keepalive: true,
    });
  } catch {
    // Storage cleanup is not user-critical; swallow.
  }
}
