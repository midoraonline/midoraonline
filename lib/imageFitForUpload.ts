"use client";

import { MAX_IMAGE_BYTES } from "@/lib/uploads/policy";
import { UploadProblem } from "@/lib/uploads/errors";

/**
 * Image preparation never lowers quality:
 * - Files that fit the 16MB limit are uploaded exactly as picked.
 * - HEIC/HEIF (which browsers can't show) is converted at full resolution,
 *   lossless PNG first, JPEG at quality 1 only if the PNG would not fit.
 * - Anything still over the limit is rejected, never shrunk or recompressed.
 */

function stemName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function isHeicOrHeif(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.includes("heic") || type.includes("heif")) return true;
  return /\.(heic|heif)$/i.test(file.name);
}

export function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name);
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
      el.onerror = () => reject(new UploadProblem("wrong-type"));
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UploadProblem("wrong-type"))),
      type,
      quality,
    );
  });
}

function fileFromBlob(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type, lastModified: Date.now() });
}

async function encodeFullResolution(bitmap: ImageBitmap, baseName: string, maxBytes: number): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, bitmap.width);
  canvas.height = Math.max(1, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UploadProblem("wrong-type");
  ctx.drawImage(bitmap, 0, 0);
  try {
    const png = await canvasToBlob(canvas, "image/png");
    if (png.size <= maxBytes) return fileFromBlob(png, `${baseName}.png`, "image/png");
  } catch {
    // PNG encode can fail on huge canvases; JPEG at quality 1 below.
  }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 1);
  return fileFromBlob(jpeg, `${baseName}.jpg`, "image/jpeg");
}

async function convertWithHeic2Any(file: File, maxBytes: number): Promise<File> {
  const convert = (await import("heic2any")).default;
  const base = stemName(file.name);
  try {
    const out = await convert({ blob: file, toType: "image/png" });
    const png = Array.isArray(out) ? out[0] : out;
    if (png && png.size <= maxBytes) return fileFromBlob(png, `${base}.png`, "image/png");
  } catch {
    // fall through to JPEG at quality 1
  }
  const out = await convert({ blob: file, toType: "image/jpeg", quality: 1 });
  const jpeg = Array.isArray(out) ? out[0] : out;
  if (!jpeg) throw new UploadProblem("wrong-type");
  return fileFromBlob(jpeg, `${base}.jpg`, "image/jpeg");
}

async function convertHeic(file: File, maxBytes: number): Promise<File> {
  try {
    const bitmap = await decodeBitmap(file);
    try {
      return await encodeFullResolution(bitmap, stemName(file.name), maxBytes);
    } finally {
      bitmap.close();
    }
  } catch {
    try {
      return await convertWithHeic2Any(file, maxBytes);
    } catch {
      throw new UploadProblem("wrong-type");
    }
  }
}

/** Original file (or full-quality HEIC conversion). Throws UploadProblem over the limit. */
export async function prepareImageForUpload(file: File, maxBytes = MAX_IMAGE_BYTES): Promise<File> {
  if (!looksLikeImage(file)) throw new UploadProblem("wrong-type");
  if (file.size > maxBytes && !isHeicOrHeif(file)) throw new UploadProblem("too-large");
  const prepared = isHeicOrHeif(file) ? await convertHeic(file, maxBytes) : file;
  if (prepared.size > maxBytes) throw new UploadProblem("too-large");
  return prepared;
}

/** Profile photos use the same rules. */
export async function avatarFileForUpload(file: File): Promise<File> {
  return prepareImageForUpload(file, Number.POSITIVE_INFINITY);
}
