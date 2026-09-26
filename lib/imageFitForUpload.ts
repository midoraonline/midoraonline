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
const HEIC_JPEG_QUALITY = 0.95;
const DECODE_ERROR = "We couldn't open this image. Try a different photo.";

function stemName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

function hasAlphaHint(type: string | undefined): boolean {
  return Boolean(type && (type.includes("png") || type.includes("webp") || type.includes("gif")));
}

function isHeicOrHeif(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.includes("heic") || type.includes("heif")) return true;
  return /\.(heic|heif)$/i.test(file.name);
}

async function decodeBitmap(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Some browsers only decode via an <img> element.
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(DECODE_ERROR));
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function assertDecodable(file: File): Promise<void> {
  try {
    const bitmap = await decodeBitmap(file);
    bitmap.close();
  } catch {
    throw new Error(DECODE_ERROR);
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
        else reject(new Error(DECODE_ERROR));
      },
      type,
      quality,
    );
  });
}

function fileFromBlob(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type, lastModified: Date.now() });
}

async function encodeBitmapFullQuality(
  bitmap: ImageBitmap,
  baseName: string,
  maxBytes: number,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, bitmap.width);
  canvas.height = Math.max(1, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(DECODE_ERROR);
  ctx.drawImage(bitmap, 0, 0);
  try {
    const png = await canvasToBlob(canvas, "image/png", 1);
    if (png.size <= maxBytes) return fileFromBlob(png, `${baseName}.png`, "image/png");
  } catch {
    // PNG encode can fail; JPEG below is the displayable fallback.
  }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", HEIC_JPEG_QUALITY);
  return fileFromBlob(jpeg, `${baseName}.jpg`, "image/jpeg");
}

async function convertWithHeic2Any(file: File, maxBytes: number): Promise<File> {
  const mod = await import("heic2any");
  const convert = mod.default;
  const base = stemName(file.name);
  try {
    const pngResult = await convert({ blob: file, toType: "image/png" });
    const png = Array.isArray(pngResult) ? pngResult[0] : pngResult;
    if (png && png.size <= maxBytes) return fileFromBlob(png, `${base}.png`, "image/png");
  } catch {
    // Lossless PNG may be unsupported or too large to encode.
  }
  const jpegResult = await convert({
    blob: file,
    toType: "image/jpeg",
    quality: HEIC_JPEG_QUALITY,
  });
  const jpeg = Array.isArray(jpegResult) ? jpegResult[0] : jpegResult;
  if (!jpeg) throw new Error(DECODE_ERROR);
  return fileFromBlob(jpeg, `${base}.jpg`, "image/jpeg");
}

/** HEIC/HEIF only: full-resolution JPEG at 0.95, or PNG when the lossless file fits. */
async function convertHeicFullQuality(file: File, maxBytes: number): Promise<File> {
  try {
    const bitmap = await decodeBitmap(file);
    try {
      return await encodeBitmapFullQuality(bitmap, stemName(file.name), maxBytes);
    } finally {
      bitmap.close();
    }
  } catch {
    try {
      return await convertWithHeic2Any(file, maxBytes);
    } catch {
      throw new Error(DECODE_ERROR);
    }
  }
}

/**
 * Shrink an image that is already over the upload limit.
 * Prefer WebP (keeps transparency after BG removal); fall back to JPEG.
 */
async function compressOverLimit(file: File, maxBytes: number): Promise<File> {
  const bitmap = await decodeBitmap(file).catch(() => {
    throw new Error(DECODE_ERROR);
  });
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
      if (!ctx) throw new Error(DECODE_ERROR);
      ctx.drawImage(bitmap, 0, 0, w, h);

      for (const type of mimeCandidates) {
        const qualities = type === "image/png" ? ([0.92] as const) : QUALITY_STEPS;
        for (const q of qualities) {
          try {
            const blob = await canvasToBlob(canvas, type, q);
            if (!best || blob.size < best.blob.size) {
              best = { blob, type };
            }
            if (blob.size <= maxBytes) {
              const ext =
                type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
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

export async function fitImageForUpload(file: File, maxBytes: number): Promise<File> {
  const prepared = isHeicOrHeif(file) ? await convertHeicFullQuality(file, maxBytes) : file;

  if (prepared.size <= maxBytes) {
    if (prepared === file) await assertDecodable(file);
    return prepared;
  }

  return compressOverLimit(prepared, maxBytes);
}

export async function fitImagesForUpload(files: File[], maxBytes: number): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) {
    out.push(await fitImageForUpload(f, maxBytes));
  }
  return out;
}
