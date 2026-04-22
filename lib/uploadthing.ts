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

/**
 * Authentication for third-party uploads.
 *
 * Our main access token now lives in an httpOnly cookie on the API origin,
 * which is unreadable from the browser and not sent to the Next.js
 * `/api/uploadthing` route (different origin). So we exchange the cookie
 * session for a short-lived Bearer token and forward that to the upload
 * middleware.
 *
 * Pass this as `headers={getUploadThingAuthHeaders}` on the upload button.
 */
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
