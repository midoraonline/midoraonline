"use client";

/** UploadThing productImage / shopLogo / imageUploader caps (keep in sync with app/api/uploadthing/core.ts). */
export const UPLOAD_IMAGE_MAX_BYTES = {
  productImage: 8 * 1024 * 1024,
  shopLogo: 4 * 1024 * 1024,
  imageUploader: 4 * 1024 * 1024,
} as const;

export type UploadImageEndpoint = keyof typeof UPLOAD_IMAGE_MAX_BYTES;

const EDGE_STEPS = [2048, 1600, 1280, 1024, 800, 640] as const;
const QUALITY_STEPS = [0.88, 0.78, 0.68, 0.58] as const;

function stemName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

function hasAlphaHint(type: string | undefined): boolean {
  return Boolean(type && (type.includes("png") || type.includes("webp") || type.includes("gif")));
}

async function decodeBitmap(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Safari / HEIC / odd MIME: fall through to <img> decode.
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(
          new Error(
            "Could not read this image. If it is HEIC/HEIF from iPhone, convert to JPEG or PNG first.",
          ),
        );
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Browser could not encode ${type}.`));
      },
      type,
      quality,
    );
  });
}

/**
 * Shrink / re-encode an image so it fits under UploadThing max bytes.
 * Prefer WebP (keeps transparency after BG removal); fall back to JPEG.
 */
export async function fitImageForUpload(
  file: File,
  maxBytes: number,
): Promise<File> {
  if (file.size <= maxBytes && file.type.startsWith("image/")) {
    // SVG / exotic types still pass size check; UploadThing accepts raster images.
    if (!file.type.includes("svg")) return file;
  }

  const bitmap = await decodeBitmap(file);
  try {
    const preferAlpha = hasAlphaHint(file.type);
    const mimeCandidates = preferAlpha
      ? (["image/webp", "image/png", "image/jpeg"] as const)
      : (["image/webp", "image/jpeg", "image/png"] as const);

    let best: { blob: Blob; type: string } | null = null;

    for (const maxEdge of EDGE_STEPS) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable in this browser.");
      ctx.drawImage(bitmap, 0, 0, w, h);

      for (const type of mimeCandidates) {
        const qualities =
          type === "image/png" ? ([0.92] as const) : QUALITY_STEPS;
        for (const q of qualities) {
          try {
            const blob = await canvasToBlob(canvas, type, q);
            if (!best || blob.size < best.blob.size) {
              best = { blob, type };
            }
            if (blob.size <= maxBytes) {
              const ext =
                type === "image/png"
                  ? "png"
                  : type === "image/webp"
                    ? "webp"
                    : "jpg";
              return new File([blob], `${stemName(file.name)}.${ext}`, {
                type,
                lastModified: Date.now(),
              });
            }
          } catch {
            // Encoding unsupported (e.g. old Safari WebP) — try next format.
          }
        }
      }
    }

    if (best && best.blob.size <= maxBytes) {
      const ext = best.type.includes("png")
        ? "png"
        : best.type.includes("webp")
          ? "webp"
          : "jpg";
      return new File([best.blob], `${stemName(file.name)}.${ext}`, {
        type: best.type,
        lastModified: Date.now(),
      });
    }

    throw new Error(
      `Image is still over ${(maxBytes / (1024 * 1024)).toFixed(0)}MB after compression. Try a smaller photo.`,
    );
  } finally {
    bitmap.close();
  }
}

export async function fitImagesForUpload(
  files: File[],
  maxBytes: number,
): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) {
    out.push(await fitImageForUpload(f, maxBytes));
  }
  return out;
}
