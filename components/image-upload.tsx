"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing, getUploadThingAuthHeaders } from "@/lib/uploadthing";
import { watermarkProductFilesIfShopLogo } from "@/lib/watermark/client-apply";
import {
  isBgRemovalSupported,
  prewarmBgRemoval,
  removeBackground,
  type BgRemovalProgress,
} from "@/lib/bgRemoval";
import { inspectImageMetadata } from "@/lib/imageMetadata";
import {
  fitImagesForUpload,
  UPLOAD_IMAGE_MAX_BYTES,
} from "@/lib/imageFitForUpload";
import {
  BG_COLOR_PRESETS,
  compositeOnColor,
} from "@/lib/bgComposite";

type Endpoint = "shopLogo" | "productImage" | "imageUploader";

type ImageUploadProps = {
  endpoint: Endpoint;
  onUploadComplete?: (url: string) => void;
  onUploadManyComplete?: (urls: string[]) => void;
  label?: string;
  accept?: string;
  className?: string;
  previewUrl?: string;
  multiple?: boolean;
  allowBackgroundRemoval?: boolean;
  watermarkLogoUrl?: string | null;
};

export type ImageUploadHandle = {
  submitFiles: (files: File[]) => void;
  isBusy: () => boolean;
};

function endpointDefaultsAllowBg(endpoint: Endpoint): boolean {
  return endpoint === "productImage" || endpoint === "shopLogo";
}

function fileExt(mime: string | undefined): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  return "jpg";
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(function ImageUpload({
  endpoint,
  onUploadComplete,
  onUploadManyComplete,
  label = "Add photos",
  accept = "image/*",
  className = "",
  previewUrl,
  multiple = false,
  allowBackgroundRemoval,
  watermarkLogoUrl,
}, ref) {
  const [uploadPct, setUploadPct] = useState(0);
  const [preparing, setPreparing] = useState<
    { stage: "watermark" | "bg"; current: number; total: number; pct?: number } | null
  >(null);
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const inputRef = useRef<HTMLInputElement>(null);

  const bgEnabled = allowBackgroundRemoval ?? endpointDefaultsAllowBg(endpoint);
  const shouldWatermark =
    endpoint === "productImage" && Boolean(watermarkLogoUrl?.trim());

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: getUploadThingAuthHeaders,
    onUploadBegin: () => setUploadPct(0),
    onUploadProgress: (p) => setUploadPct(Math.round(p)),
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((r) => r.ufsUrl ?? r.url)
        .filter((u): u is string => Boolean(u));
      if (onUploadManyComplete && urls.length) onUploadManyComplete(urls);
      else if (urls[0] && onUploadComplete) onUploadComplete(urls[0]);
      setUploadPct(0);
      if (urls.length) {
        toast.success(
          urls.length === 1 ? "Photo uploaded" : `${urls.length} photos uploaded`,
        );
      }
    },
    onUploadError: (e) => {
      setUploadPct(0);
      toast.error("Upload failed", { description: e.message });
    },
  });

  const removeBackgrounds = useCallback(
    async (files: File[]): Promise<File[]> => {
      const out: File[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const onProgress: BgRemovalProgress = (_key, current, total) => {
          setPreparing({
            stage: "bg",
            current: i + 1,
            total: files.length,
            pct: Math.round((current / Math.max(1, total)) * 100),
          });
        };
        setPreparing({ stage: "bg", current: i + 1, total: files.length });
        try {
          let blob = await removeBackground(file, { onProgress });
          try {
            blob = await compositeOnColor(blob, bgColor);
          } catch {
            /* keep transparent cutout if composite fails */
          }
          const ext = fileExt(blob.type);
          const stem = file.name.replace(/\.[^.]+$/, "");
          out.push(
            new File([blob], `${stem}-nobg.${ext}`, {
              type: blob.type || "image/jpeg",
            }),
          );
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Background removal failed for one image.";
          toast.warning("Kept original background", { description: msg });
          out.push(file);
        }
      }
      return out;
    },
    [bgColor],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      try {
        // Metadata gate: reject stock/AI/watermarked images before we touch
        // the network. Mirrors the server-side moderation stage so a merchant
        // who passes here also passes there.
        const cleared: File[] = [];
        for (const file of files) {
          const verdict = await inspectImageMetadata(file);
          if (verdict.ok) {
            cleared.push(file);
          } else {
            toast.error("Image rejected", { description: verdict.reason });
          }
        }
        if (!cleared.length) return;

        let processed = cleared;
        if (bgEnabled && autoRemoveBg) {
          if (!isBgRemovalSupported()) {
            toast.warning("Kept original background", {
              description:
                "Background removal needs WebAssembly. Uploading originals instead.",
            });
          } else {
            processed = await removeBackgrounds(cleared);
          }
        }
        // Keep originals that already fit. HEIC is converted; only over-limit files are resized.
        const maxBytes = UPLOAD_IMAGE_MAX_BYTES[endpoint];
        try {
          processed = await fitImagesForUpload(processed, maxBytes);
        } catch (err) {
          const description =
            err instanceof Error
              ? err.message
              : "Could not compress images under the upload size limit.";
          toast.error("Upload failed", { description });
          setPreparing(null);
          return;
        }
        if (shouldWatermark) {
          setPreparing({ stage: "watermark", current: 0, total: processed.length });
          try {
            processed = await watermarkProductFilesIfShopLogo(
              processed,
              watermarkLogoUrl,
            );
          } catch (err) {
            // Watermarking is best-effort — never block the actual upload.
            // Common failure: dev / corporate-proxy environments where the
            // server route can't fetch the shop logo from the CDN.
            const description =
              err instanceof Error
                ? err.message
                : "Uploading photos without the shop logo overlay.";
            toast.warning("Logo overlay skipped", { description });
          }
        }
        setPreparing(null);
        await startUpload(processed);
      } catch (err) {
        setPreparing(null);
        const description =
          err instanceof Error ? err.message : "Could not prepare images for upload.";
        toast.error("Upload failed", { description });
      }
    },
    [
      bgEnabled,
      autoRemoveBg,
      removeBackgrounds,
      shouldWatermark,
      watermarkLogoUrl,
      startUpload,
      endpoint,
    ],
  );

  useEffect(() => {
    if (bgEnabled && autoRemoveBg) prewarmBgRemoval();
  }, [bgEnabled, autoRemoveBg]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    void uploadFiles(files);
  };

  const busy = isUploading || preparing !== null;

  useImperativeHandle(
    ref,
    () => ({
      submitFiles: (files: File[]) => {
        if (busy || !files.length) return;
        void uploadFiles(files);
      },
      isBusy: () => busy,
    }),
    [busy, uploadFiles],
  );

  const buttonLabel = (() => {
    if (isUploading) return `Uploading… ${uploadPct}%`;
    if (preparing?.stage === "watermark") return "Applying logo…";
    if (preparing?.stage === "bg") {
      const pct = preparing.pct ?? 0;
      return `Removing background ${preparing.current}/${preparing.total}${
        pct ? ` · ${pct}%` : "…"
      }`;
    }
    return label;
  })();

  const progressPct = isUploading
    ? uploadPct
    : preparing?.stage === "bg"
      ? preparing.pct ?? 0
      : 0;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          aria-hidden
          onChange={handleChange}
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="dm-btn dm-btn-secondary dm-btn-sm"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {buttonLabel}
            </>
          ) : (
            buttonLabel
          )}
        </button>
        {previewUrl && !busy && (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-surface-subtle">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      {bgEnabled ? (
        <div className="mt-2 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="size-3.5 rounded border-border text-accent focus:ring-accent"
              checked={autoRemoveBg}
              onChange={(e) => setAutoRemoveBg(e.target.checked)}
              disabled={busy || !isBgRemovalSupported()}
            />
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>
              Auto-remove background
              <span className="ml-1 text-[10px] text-muted">
                {isBgRemovalSupported()
                  ? "(falls back to original if it fails)"
                  : "(unavailable here — keeps original)"}
              </span>
            </span>
          </label>
          {autoRemoveBg && isBgRemovalSupported() ? (
            <div className="flex flex-wrap items-center gap-2 pl-5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Fill color
              </span>
              {BG_COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  disabled={busy}
                  onClick={() => setBgColor(p.value)}
                  className={`size-6 rounded-full border-2 shadow-xs ${
                    bgColor.toLowerCase() === p.value.toLowerCase()
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: p.value }}
                  aria-label={p.label}
                />
              ))}
              <label className="inline-flex items-center gap-1 text-[10px] text-muted">
                <input
                  type="color"
                  value={bgColor}
                  disabled={busy}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-6 cursor-pointer rounded border border-border bg-transparent p-0"
                  aria-label="Custom background color"
                />
                Custom
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {progressPct > 0 && busy ? (
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-surface-subtle"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
});
