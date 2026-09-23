"use client";

/**
 * Thin wrapper around `@imgly/background-removal` (in-browser ONNX).
 * Model + WASM (~40MB) load on first use from IMG.LY CDN or
 * NEXT_PUBLIC_IMGLY_PUBLIC_PATH when self-hosted under /public.
 */

type RemoveBackgroundFn = (
  input: File | Blob,
  config?: Record<string, unknown>,
) => Promise<Blob>;

let modulePromise: Promise<RemoveBackgroundFn> | null = null;

const PACKAGE_VERSION = "1.7.0";
const DEFAULT_PUBLIC_PATH = `https://staticimgly.com/@imgly/background-removal-data/${PACKAGE_VERSION}/dist/`;

function publicPath(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH?.trim()
      : "";
  if (fromEnv) return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  return DEFAULT_PUBLIC_PATH;
}

function pickModel(): "isnet_fp16" | "isnet_quint8" {
  // Low-memory / mobile: smaller quantized model downloads and runs faster.
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (
      (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 4) ||
      (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4)
    ) {
      return "isnet_quint8";
    }
  } catch {
    /* ignore */
  }
  return "isnet_fp16";
}

export function isBgRemovalSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}

function humanizeBgError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err ?? "Unknown error");
  const lower = raw.toLowerCase();
  if (
    lower.includes("publicpath") ||
    lower.includes("resource metadata") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("load failed")
  ) {
    return new Error(
      "Could not download the background-removal AI model. Check network access to staticimgly.com (or set NEXT_PUBLIC_IMGLY_PUBLIC_PATH to self-hosted assets).",
    );
  }
  if (lower.includes("session") || lower.includes("wasm") || lower.includes("onnx")) {
    return new Error(
      "Background removal failed to start in this browser (WebAssembly/ONNX). Try Chrome or Firefox, or upload without auto-remove.",
    );
  }
  return err instanceof Error ? err : new Error(raw || "Background removal failed.");
}

async function loadRemoveFn(): Promise<RemoveBackgroundFn> {
  if (!isBgRemovalSupported()) {
    throw new Error("This browser does not support WebAssembly, required for background removal.");
  }
  const mod = await import("@imgly/background-removal");
  const named = mod.removeBackground;
  if (typeof named === "function") return named as RemoveBackgroundFn;
  const fallback = (mod as unknown as { default?: unknown }).default;
  if (typeof fallback === "function") return fallback as RemoveBackgroundFn;
  throw new Error("Background removal library loaded incorrectly (missing removeBackground export).");
}

function getRemoveFn(): Promise<RemoveBackgroundFn> {
  if (!modulePromise) {
    modulePromise = loadRemoveFn().catch((err) => {
      modulePromise = null;
      throw humanizeBgError(err);
    });
  }
  return modulePromise;
}

/** Kick off the dynamic import without awaiting — prefetch when the checkbox is enabled. */
export function prewarmBgRemoval(): void {
  if (!isBgRemovalSupported()) return;
  void getRemoveFn().catch(() => {
    /* prewarm is best-effort */
  });
}

export type BgRemovalProgress = (key: string, current: number, total: number) => void;

/**
 * Run background removal on a File/Blob and return a PNG/WebP Blob.
 * Throws a user-facing Error on failure (caller should fall back to the original).
 */
export async function removeBackground(
  input: File | Blob,
  opts: { onProgress?: BgRemovalProgress } = {},
): Promise<Blob> {
  try {
    const fn = await getRemoveFn();
    return await fn(input, {
      progress: opts.onProgress,
      publicPath: publicPath(),
      model: pickModel(),
      device: "cpu",
      proxyToWorker: false,
      output: { format: "image/png", quality: 0.9 },
    });
  } catch (err) {
    throw humanizeBgError(err);
  }
}
