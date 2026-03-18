import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

/**
 * Use for authenticated uploads. Pass to components as headers={getUploadThingAuthHeaders}.
 * Reads midora_access_token from localStorage (client-only).
 */
export function getUploadThingAuthHeaders(): Promise<Record<string, string>> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("midora_access_token")
      : null;
  return Promise.resolve({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
}
