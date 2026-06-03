"use client";

type BgRemovalModule = typeof import("@imgly/background-removal");

let modulePromise: Promise<BgRemovalModule> | null = null;

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

export async function removeBackground(
  input: File | Blob,
  opts: { onProgress?: BgRemovalProgress } = {}
): Promise<Blob> {
  const mod = await getModule();
  return mod.removeBackground(input, {
    progress: opts.onProgress,
    model: "isnet_fp16",
    output: { format: "image/png", quality: 0.9 },
  });
}
