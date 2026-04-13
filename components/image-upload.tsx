"use client";

import { useRef, useState } from "react";
import { useUploadThing, getUploadThingAuthHeaders } from "@/lib/uploadthing";
import Image from "next/image";

type Endpoint = "shopLogo" | "productImage" | "imageUploader";

type ImageUploadProps = {
  endpoint: Endpoint;
  /** Single-file success (first file when multiple). */
  onUploadComplete?: (url: string) => void;
  /** Multi-file batch (all URLs from one picker batch). Prefer for product galleries. */
  onUploadManyComplete?: (urls: string[]) => void;
  label?: string;
  accept?: string;
  className?: string;
  previewUrl?: string;
  /** Allow selecting several files at once (endpoint must allow maxFileCount &gt; 1). */
  multiple?: boolean;
};

export function ImageUpload({
  endpoint,
  onUploadComplete,
  onUploadManyComplete,
  label = "Upload image",
  accept = "image/*",
  className = "",
  previewUrl,
  multiple = false,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: getUploadThingAuthHeaders,
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((r) => r.ufsUrl ?? r.url)
        .filter((u): u is string => Boolean(u));
      if (onUploadManyComplete && urls.length) {
        onUploadManyComplete(urls);
        return;
      }
      const url = urls[0];
      if (url && onUploadComplete) onUploadComplete(url);
    },
    onUploadError: (e) => setError(e.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setError(null);
    startUpload(Array.from(files));
    e.target.value = "";
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          aria-hidden
          onChange={handleChange}
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isUploading ? "Uploading…" : label}
        </button>
        {previewUrl && (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-background">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
