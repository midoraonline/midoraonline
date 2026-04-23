"use client";

/**
 * Thin wrapper around `@imgly/background-removal`.
 *
 * The library ships a ~40MB ONNX model + wasm runtime.  We never want that in
 * the main bundle — both the model and the library itself load on demand
 * only the first time a user clicks "Remove background".  Subsequent calls in
 * the same session reuse the warm module.
 */

type BgRemovalModule = typeof import("@imgly/background-removal");

let modulePromise: Promise<BgRemovalModule> | null = null;

/** Kick off the dynamic import without awaiting it — handy for prefetch on hover. */
export function prewarmBgRemoval(): void {
  if (!modulePromise) {
    modulePromise = import("@imgly/background-removal");
  }
}

async function getModule(): Promise<BgRemovalModule> {
  if (!modulePromise) {
    modulePromise = import("@imgly/background-removal");
  }
  return modulePromise;
}

export type BgRemovalProgress = (key: string, current: number, total: number) => void;

/**
 * Run background removal on a File/Blob and return the processed PNG as a Blob.
 * Falls back to throwing an Error (caller should show a friendly message).
 */
export async function removeBackground(
  input: File | Blob,
  opts: { onProgress?: BgRemovalProgress } = {}
): Promise<Blob> {
  const mod = await getModule();
  return mod.removeBackground(input, {
    progress: opts.onProgress,
    // Smaller / faster model variant → noticeably quicker on low-end phones,
    // still produces clean edges for product photography.
    model: "isnet_fp16",
    output: { format: "image/png", quality: 0.9 },
  });
}
