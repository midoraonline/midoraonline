"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useImageUploads } from "@/hooks/useImageUploads";
import { watermarkProductFilesIfShopLogo } from "@/lib/watermark/client-apply";
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
  watermarkLogoUrl?: string | null;
  /** Overrides the policy maximum (admin-configured listing photo cap). */
  maxFiles?: number;
  /** Headless: no button; the parent opens the picker via the handle. */
  hideButton?: boolean;
};

export type ImageUploadHandle = {
  submitFiles: (files: File[]) => void;
  open: () => void;
  isBusy: () => boolean;
};

/**
 * Button + live upload tiles. The shop-logo overlay is opt-in and re-saves at
 * maximum quality. Background removal runs server-side per photo (see MediaDropzone). Metadata checks apply to listing
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
    watermarkLogoUrl,
    maxFiles,
    hideButton = false,
  },
  ref,
) {
  const policy = IMAGE_POLICY[endpoint];
  const canWatermark = policy.allowWatermark && Boolean(watermarkLogoUrl?.trim());
  const [addLogo, setAddLogo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const transform = useCallback(
    async (file: File, setStage: (s: string) => void): Promise<File> => {
      let out = file;
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
    [addLogo, canWatermark, watermarkLogoUrl],
  );

  const { items, addFiles, cancel, busy, stage } = useImageUploads({
    endpoint,
    existingCount,
    maxFiles,
    transform: canWatermark && addLogo ? transform : undefined,
    onUploaded: (url) => {
      if (onUploadManyComplete) onUploadManyComplete([url]);
      else onUploadComplete?.(url);
    },
  });

  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);
  useImperativeHandle(
    ref,
    () => ({
      submitFiles: (files: File[]) => void addFiles(files),
      open: () => inputRef.current?.click(),
      isBusy: () => busyRef.current,
    }),
    [addFiles],
  );

  const cap = maxFiles ?? policy.maxFiles;
  const full = existingCount >= cap && cap > 1;

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
          className={`dm-btn dm-btn-secondary dm-btn-sm ${hideButton ? "hidden" : ""}`}
        >
          {stage ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {stage}
            </>
          ) : full ? (
            `${cap} of ${cap} added`
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

      {canWatermark ? (
        <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-accent focus:ring-accent"
                checked={addLogo}
                onChange={(e) => setAddLogo(e.target.checked)}
              />
              Add my shop logo to new photos
            </label>
          </div>
      ) : null}
    </div>
  );
});
