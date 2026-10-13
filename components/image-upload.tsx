"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useImageUploads } from "@/hooks/useImageUploads";
import { watermarkProductFilesIfShopLogo } from "@/lib/watermark/client-apply";
import { isBgRemovalSupported, prewarmBgRemoval, removeBackground } from "@/lib/bgRemoval";
import { BG_COLOR_PRESETS, compositeOnColor } from "@/lib/bgComposite";
import { IMAGE_POLICY, type ImageEndpoint } from "@/lib/uploads/policy";
import { UploadTile } from "@/components/upload/UploadTile";

/** The logo overlay route accepts up to 4MB; bigger photos keep the original. */
const WATERMARK_MAX_BYTES = 4 * 1024 * 1024;

type ImageUploadProps = {
  endpoint: ImageEndpoint;
  onUploadComplete?: (url: string) => void;
  /** Called per finished file (kept for older call sites). */
  onUploadManyComplete?: (urls: string[]) => void;
  label?: string;
  className?: string;
  multiple?: boolean;
  /** Images already attached; counts against the per-kind maximum. */
  existingCount?: number;
  allowBackgroundRemoval?: boolean;
  watermarkLogoUrl?: string | null;
};

export type ImageUploadHandle = {
  submitFiles: (files: File[]) => void;
  isBusy: () => boolean;
};

function fileExt(mime: string | undefined): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  return "jpg";
}

/**
 * Button + live upload tiles. Background removal and the shop-logo overlay are
 * opt-in; both re-save at maximum quality. Metadata checks apply to listing
 * photos only (see lib/uploads/policy).
 */
export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(function ImageUpload(
  {
    endpoint,
    onUploadComplete,
    onUploadManyComplete,
    label = "Add photos",
    className = "",
    multiple = false,
    existingCount = 0,
    allowBackgroundRemoval,
    watermarkLogoUrl,
  },
  ref,
) {
  const policy = IMAGE_POLICY[endpoint];
  const bgEnabled = allowBackgroundRemoval ?? policy.allowBackgroundRemoval;
  const canWatermark = policy.allowWatermark && Boolean(watermarkLogoUrl?.trim());
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [addLogo, setAddLogo] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const inputRef = useRef<HTMLInputElement>(null);

  const transform = useCallback(
    async (file: File, setStage: (s: string) => void): Promise<File> => {
      let out = file;
      if (bgEnabled && autoRemoveBg && isBgRemovalSupported()) {
        setStage("Removing background…");
        try {
          let blob = await removeBackground(out);
          try {
            blob = await compositeOnColor(blob, bgColor);
          } catch {
            /* keep the transparent cutout */
          }
          const stem = out.name.replace(/\.[^.]+$/, "");
          out = new File([blob], `${stem}-nobg.${fileExt(blob.type)}`, { type: blob.type || "image/png" });
        } catch {
          /* keep the original photo */
        }
      }
      if (canWatermark && addLogo && out.size <= WATERMARK_MAX_BYTES) {
        setStage("Adding your logo…");
        try {
          [out] = await watermarkProductFilesIfShopLogo([out], watermarkLogoUrl);
        } catch {
          /* keep the photo without the overlay */
        }
      }
      return out;
    },
    [addLogo, autoRemoveBg, bgColor, bgEnabled, canWatermark, watermarkLogoUrl],
  );

  const { items, addFiles, cancel, busy, stage } = useImageUploads({
    endpoint,
    existingCount,
    transform: (bgEnabled && autoRemoveBg) || (canWatermark && addLogo) ? transform : undefined,
    onUploaded: (url) => {
      if (onUploadManyComplete) onUploadManyComplete([url]);
      else onUploadComplete?.(url);
    },
  });

  useEffect(() => {
    if (bgEnabled && autoRemoveBg) prewarmBgRemoval();
  }, [bgEnabled, autoRemoveBg]);

  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);
  useImperativeHandle(
    ref,
    () => ({
      submitFiles: (files: File[]) => void addFiles(files),
      isBusy: () => busyRef.current,
    }),
    [addFiles],
  );

  const full = existingCount >= policy.maxFiles && policy.maxFiles > 1;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          className="hidden"
          aria-hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void addFiles(files);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={full}
          className="dm-btn dm-btn-secondary dm-btn-sm"
        >
          {stage ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {stage}
            </>
          ) : full ? (
            `${policy.maxFiles} of ${policy.maxFiles} added`
          ) : (
            label
          )}
        </button>
      </div>

      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((it) => (
            <UploadTile key={it.id} item={it} onCancel={() => cancel(it.id)} />
          ))}
        </div>
      ) : null}

      {bgEnabled || canWatermark ? (
        <div className="mt-2 space-y-2">
          {canWatermark ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-accent focus:ring-accent"
                checked={addLogo}
                onChange={(e) => setAddLogo(e.target.checked)}
              />
              Add my shop logo to new photos
            </label>
          ) : null}
          {bgEnabled ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-accent focus:ring-accent"
                checked={autoRemoveBg}
                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                disabled={!isBgRemovalSupported()}
              />
              <Sparkles className="size-3.5" aria-hidden="true" />
              {isBgRemovalSupported() ? "Remove background" : "Background removal isn't available on this device"}
            </label>
          ) : null}
          {bgEnabled && autoRemoveBg && isBgRemovalSupported() ? (
            <div className="flex flex-wrap items-center gap-2 pl-6">
              <span className="text-xs text-muted">Fill</span>
              {BG_COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  onClick={() => setBgColor(p.value)}
                  className={`size-7 rounded-full border-2 ${
                    bgColor.toLowerCase() === p.value.toLowerCase()
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: p.value }}
                  aria-label={p.label}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="size-7 cursor-pointer rounded border border-border bg-transparent p-0"
                aria-label="Custom background color"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
