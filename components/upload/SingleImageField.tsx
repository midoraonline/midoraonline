"use client";

import { useEffect, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { useImageUploads } from "@/hooks/useImageUploads";
import { discardUploads } from "@/lib/uploads/discard";
import type { ImageEndpoint } from "@/lib/uploads/policy";
import { UploadTile } from "./UploadTile";

type Props = {
  endpoint: Extract<ImageEndpoint, "shopLogo" | "shopBanner" | "verificationDoc" | "avatarImage">;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** "square" for logos, "wide" for banners. */
  shape?: "square" | "wide";
  emptyLabel?: string;
  hint?: string;
  disabled?: boolean;
};

/**
 * One image (logo, banner, document): instant preview, progress, X to cancel
 * or remove, Replace. Removed or replaced files are deleted from UploadThing
 * when nothing saved still uses them (the API checks ownership and use).
 */
export function SingleImageField({
  endpoint,
  value,
  onChange,
  shape = "square",
  emptyLabel = "Upload image",
  hint,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const { items, addFiles, cancel, busy, policy } = useImageUploads({
    endpoint,
    onUploaded: (url) => {
      const previous = valueRef.current;
      onChange(url);
      if (previous && previous !== url) discardUploads([previous]);
    },
  });

  const box = shape === "wide" ? "aspect-[3/1] w-full" : "size-24";
  const pending = items[items.length - 1];

  const pick = () => inputRef.current?.click();
  const remove = () => {
    if (value) discardUploads([value]);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        aria-hidden
        disabled={disabled || busy}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void addFiles(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        {pending ? (
          <UploadTile item={pending} onCancel={() => cancel(pending.id)} className={box} fit={shape === "wide" ? "cover" : "contain"} />
        ) : value ? (
          <div className={`relative overflow-hidden rounded-lg border border-border bg-surface-subtle ${box}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- CDN image, any aspect */}
            <img src={value} alt={`Current ${policy.noun}`} className={`size-full ${shape === "wide" ? "object-cover" : "object-contain"}`} />
            <button
              type="button"
              onClick={remove}
              disabled={disabled}
              aria-label={`Remove ${policy.noun}`}
              className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface-subtle text-xs text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${box}`}
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            {emptyLabel}
          </button>
        )}
        {value && !pending ? (
          <button type="button" onClick={pick} disabled={disabled} className="dm-btn dm-btn-secondary dm-btn-sm">
            Replace
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
