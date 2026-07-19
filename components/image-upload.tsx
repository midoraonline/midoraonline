"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing, getUploadThingAuthHeaders } from "@/lib/uploadthing";
import { watermarkProductFilesIfShopLogo } from "@/lib/watermark/client-apply";
import {
  prewarmBgRemoval,
  removeBackground,
  type BgRemovalProgress,
} from "@/lib/bgRemoval";

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

function endpointDefaultsAllowBg(endpoint: Endpoint): boolean {
  return endpoint === "productImage" || endpoint === "shopLogo";
}

function fileExt(mime: string | undefined): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  return "jpg";
}

/**
 * Image picker with a single-tap upload flow.
 *
 * Contract:
 * - Picking files starts the upload immediately — no intermediate confirmation.
 * - Background removal is opt-in via a toggle (only shown when `allowBackgroundRemoval`).
 *   The AI model is ~40MB and only downloads on first opt-in use.
 * - Watermarking (product logos) is transparent and runs before upload.
 * - Success / failure go through sonner (see AppToaster).
 */
export function ImageUpload({
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
}: ImageUploadProps) {
  const [uploadPct, setUploadPct] = useState(0);
  const [preparing, setPreparing] = useState<
    { stage: "watermark" | "bg"; current: number; total: number; pct?: number } | null
  >(null);
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
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
          const blob = await removeBackground(file, { onProgress });
          const ext = fileExt(blob.type);
          const stem = file.name.replace(/\.[^.]+$/, "");
          out.push(
            new File([blob], `${stem}-nobg.${ext}`, {
              type: blob.type || "image/png",
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
    [],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      try {
        let processed = files;
        if (bgEnabled && autoRemoveBg) {
          processed = await removeBackgrounds(files);
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
        startUpload(processed);
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
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            className="size-3.5 rounded border-border text-accent focus:ring-accent"
            checked={autoRemoveBg}
            onChange={(e) => setAutoRemoveBg(e.target.checked)}
            disabled={busy}
          />
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>
            Auto-remove background
            <span className="ml-1 text-[10px] text-muted">
              (slow on first use — downloads a 40MB AI model)
            </span>
          </span>
        </label>
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
}
