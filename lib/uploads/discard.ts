"use client";

import { apiFetch } from "@/lib/api/base";

/**
 * Ask the API to delete UploadThing files. The API only deletes files this
 * user uploaded that no listing, shop or profile uses, so it is always safe
 * to call on remove/replace/cancel. Fire-and-forget.
 */
export function discardUploads(urls: Array<string | null | undefined>): void {
  const list = urls.filter((u): u is string => typeof u === "string" && /\/f\//.test(u));
  if (!list.length) return;
  void apiFetch("/api/v1/media/discard", {
    method: "POST",
    body: { urls: list },
    keepalive: true,
    timeoutMs: 10_000,
  }).catch(() => {
    /* orphan sweep picks up anything left behind */
  });
}
