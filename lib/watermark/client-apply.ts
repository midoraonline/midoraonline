import { getUploadThingAuthHeaders } from "@/lib/uploadthing";

export async function watermarkProductFilesIfShopLogo(
  files: File[],
  shopLogoUrl: string | null | undefined,
): Promise<File[]> {
  const logo = shopLogoUrl?.trim();
  if (!logo) return files;

  const headers = await getUploadThingAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("Sign in to upload images.");
  }

  const out: File[] = [];
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      out.push(f);
      continue;
    }

    const fd = new FormData();
    fd.set("file", f);
    fd.set("logoUrl", logo);

    const res = await fetch("/api/watermark-image", {
      method: "POST",
      headers,
      body: fd,
    });

    if (!res.ok) {
      let msg = "Could not apply shop logo to image.";
      try {
        const j = (await res.json()) as { error?: string };
        if (typeof j.error === "string" && j.error) msg = j.error;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const stem = f.name.replace(/\.[^.]+$/, "");
    out.push(new File([blob], `${stem}-wm.jpg`, { type: "image/jpeg" }));
  }

  return out;
}
