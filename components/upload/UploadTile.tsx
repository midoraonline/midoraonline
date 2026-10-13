"use client";

import { Loader2, X } from "lucide-react";
import type { UploadItem } from "@/hooks/useImageUploads";

/** Local preview with a progress overlay and an X to cancel. */
export function UploadTile({
  item,
  onCancel,
  className = "size-20",
  fit = "cover",
}: {
  item: UploadItem;
  onCancel: () => void;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const pct = item.status === "uploading" ? item.progress : 0;
  return (
    <div className={`relative overflow-hidden rounded-lg border border-border bg-surface-subtle ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
      <img
        src={item.localUrl}
        alt=""
        className={`size-full ${fit === "contain" ? "object-contain" : "object-cover"} opacity-70`}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
        {item.status === "uploading" && pct > 0 ? (
          <span className="text-xs font-semibold tabular-nums drop-shadow">{pct}%</span>
        ) : (
          <Loader2 className="size-5 animate-spin drop-shadow" aria-hidden="true" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel upload"
        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
