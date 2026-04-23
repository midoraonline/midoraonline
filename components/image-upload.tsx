"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Wand2, X } from "lucide-react";
import { useUploadThing, getUploadThingAuthHeaders } from "@/lib/uploadthing";
import {
  prewarmBgRemoval,
  removeBackground,
  type BgRemovalProgress,
} from "@/lib/bgRemoval";

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
  /** Allow selecting several files at once (endpoint must allow maxFileCount > 1). */
  multiple?: boolean;
  /**
   * Offer a "Remove background" review step before upload.  Great for
   * product photography where users often shoot on cluttered tables/shelves.
   * Defaults to true for product endpoints.
   */
  allowBackgroundRemoval?: boolean;
};

type Pending = {
  id: string;
  original: File;
  originalUrl: string;
  processed?: Blob;
  processedUrl?: string;
  useProcessed: boolean;
  status: "idle" | "removing-bg" | "error";
  errorMsg?: string;
  progress?: { current: number; total: number };
};

function endpointDefaultsAllowBg(endpoint: Endpoint): boolean {
  return endpoint === "productImage" || endpoint === "shopLogo";
}

function fileToObjectUrl(f: File | Blob): string {
  return URL.createObjectURL(f);
}

function fileExt(mime: string | undefined): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  return "jpg";
}

export function ImageUpload({
  endpoint,
  onUploadComplete,
  onUploadManyComplete,
  label = "Upload image",
  accept = "image/*",
  className = "",
  previewUrl,
  multiple = false,
  allowBackgroundRemoval,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploadPct, setUploadPct] = useState(0);
  const [lastSuccessCount, setLastSuccessCount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const bgEnabled = allowBackgroundRemoval ?? endpointDefaultsAllowBg(endpoint);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: getUploadThingAuthHeaders,
    onUploadBegin: () => {
      setUploadPct(0);
      setError(null);
    },
    onUploadProgress: (p) => {
      setUploadPct(Math.round(p));
    },
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((r) => r.ufsUrl ?? r.url)
        .filter((u): u is string => Boolean(u));
      if (onUploadManyComplete && urls.length) {
        onUploadManyComplete(urls);
      } else if (urls[0] && onUploadComplete) {
        onUploadComplete(urls[0]);
      }
      setLastSuccessCount(urls.length);
      setUploadPct(100);
      setPending((list) => {
        for (const p of list) {
          URL.revokeObjectURL(p.originalUrl);
          if (p.processedUrl) URL.revokeObjectURL(p.processedUrl);
        }
        return [];
      });
    },
    onUploadError: (e) => {
      setUploadPct(0);
      setError(e.message);
    },
  });

  // Auto-dismiss the success banner after a few seconds
  useEffect(() => {
    if (!lastSuccessCount) return;
    const t = setTimeout(() => setLastSuccessCount(0), 4500);
    return () => clearTimeout(t);
  }, [lastSuccessCount]);

  // Scroll the review panel into view when it first appears so users never
  // miss the "Remove background" / "Upload all" controls.
  useEffect(() => {
    if (pending.length > 0 && reviewRef.current) {
      reviewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [pending.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the FileList into a real Array BEFORE clearing the input —
    // FileList is a live DOM object and becomes empty once input.value is reset.
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    setLastSuccessCount(0);
    e.target.value = "";

    if (!bgEnabled) {
      startUpload(files);
      return;
    }

    prewarmBgRemoval();
    const next: Pending[] = files.map((f) => ({
      id: `${f.name}-${f.size}-${crypto.randomUUID()}`,
      original: f,
      originalUrl: fileToObjectUrl(f),
      useProcessed: false,
      status: "idle",
    }));
    setPending((list) => [...list, ...next]);
  };

  async function handleRemoveBg(id: string) {
    setPending((list) =>
      list.map((p) =>
        p.id === id ? { ...p, status: "removing-bg", errorMsg: undefined } : p
      )
    );

    const progress: BgRemovalProgress = (_key, current, total) => {
      setPending((list) =>
        list.map((p) =>
          p.id === id ? { ...p, progress: { current, total } } : p
        )
      );
    };

    try {
      const target = pending.find((p) => p.id === id);
      if (!target) return;
      const blob = await removeBackground(target.original, { onProgress: progress });
      const url = fileToObjectUrl(blob);
      setPending((list) =>
        list.map((p) =>
          p.id === id
            ? {
                ...p,
                processed: blob,
                processedUrl: url,
                useProcessed: true,
                status: "idle",
                progress: undefined,
              }
            : p
        )
      );
    } catch (e) {
      setPending((list) =>
        list.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "error",
                errorMsg:
                  e instanceof Error
                    ? e.message
                    : "Background removal failed — keep original.",
                progress: undefined,
              }
            : p
        )
      );
    }
  }

  function discard(id: string) {
    setPending((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) {
        URL.revokeObjectURL(gone.originalUrl);
        if (gone.processedUrl) URL.revokeObjectURL(gone.processedUrl);
      }
      return list.filter((p) => p.id !== id);
    });
  }

  function toggleUseProcessed(id: string, use: boolean) {
    setPending((list) =>
      list.map((p) => (p.id === id ? { ...p, useProcessed: use } : p))
    );
  }

  async function confirmUpload() {
    if (!pending.length || isUploading) return;
    setUploadPct(0);
    const files = pending.map((p) => {
      if (p.useProcessed && p.processed) {
        const ext = fileExt(p.processed.type);
        const stem = p.original.name.replace(/\.[^.]+$/, "");
        return new File([p.processed], `${stem}-nobg.${ext}`, {
          type: p.processed.type || "image/png",
        });
      }
      return p.original;
    });
    startUpload(files);
  }

  const reviewCount = pending.length;

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
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="dm-pill dm-focus inline-flex items-center gap-2 border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading… {uploadPct}%
            </>
          ) : (
            label
          )}
        </button>
        {previewUrl && !reviewCount && !isUploading && (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-background">
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

      {/* Global upload progress bar — visible while bytes are in flight */}
      {isUploading && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Success toast — auto-dismisses */}
      {lastSuccessCount > 0 && !isUploading && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 dark:bg-green-950/40 dark:text-green-200">
          <CheckCircle2 className="size-4" />
          Uploaded {lastSuccessCount} {lastSuccessCount === 1 ? "image" : "images"} — see {lastSuccessCount === 1 ? "it" : "them"} in the list below.
        </div>
      )}

      {reviewCount > 0 && (
        <div
          ref={reviewRef}
          className="mt-4 space-y-3 rounded-2xl border border-primary/30 bg-surface/80 p-3 shadow-sm ring-1 ring-primary/5 backdrop-blur-sm sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground/90">
                Review {reviewCount === 1 ? "your image" : `your ${reviewCount} images`}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Tap{" "}
                <span className="inline-flex items-center gap-0.5 font-semibold text-foreground/85">
                  <Wand2 className="size-3" /> Remove background
                </span>{" "}
                to get a clean cut-out, or hit{" "}
                <span className="font-semibold text-primary">Upload {reviewCount > 1 ? "all" : ""}</span>{" "}
                to send {reviewCount === 1 ? "it" : "them"} as-is.
              </p>
            </div>
            <button
              type="button"
              onClick={confirmUpload}
              disabled={isUploading}
              className="dm-pill dm-focus inline-flex shrink-0 items-center gap-1.5 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading {uploadPct}%
                </>
              ) : (
                <>Upload {reviewCount > 1 ? "all" : ""}</>
              )}
            </button>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {pending.map((p) => {
              const showUrl = p.useProcessed && p.processedUrl ? p.processedUrl : p.originalUrl;
              const busy = p.status === "removing-bg";
              const pct = p.progress
                ? Math.round((p.progress.current / Math.max(1, p.progress.total)) * 100)
                : 0;
              return (
                <li
                  key={p.id}
                  className="group relative overflow-hidden rounded-xl border border-foreground/[0.08] bg-background"
                >
                  <div
                    className="aspect-[4/3] w-full"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #e8ecef 25%, transparent 25%), linear-gradient(-45deg, #e8ecef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e8ecef 75%), linear-gradient(-45deg, transparent 75%, #e8ecef 75%)",
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                    }}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={showUrl}
                        alt={p.original.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 100vw, 28rem"
                        unoptimized
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => discard(p.id)}
                    disabled={isUploading}
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/80 dm-focus disabled:opacity-50"
                    aria-label="Discard"
                    title="Discard"
                  >
                    <X className="size-4" strokeWidth={2.25} />
                  </button>

                  <div className="space-y-2 p-3">
                    <p className="truncate text-xs text-muted" title={p.original.name}>
                      {p.original.name}
                    </p>
                    {p.processedUrl ? (
                      <div className="flex items-center gap-1 rounded-full bg-foreground/[0.05] p-0.5 text-[11px] font-medium">
                        <button
                          type="button"
                          onClick={() => toggleUseProcessed(p.id, false)}
                          className={`flex-1 rounded-full px-3 py-1 transition-colors ${
                            !p.useProcessed
                              ? "bg-surface text-foreground shadow-sm"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUseProcessed(p.id, true)}
                          className={`flex-1 rounded-full px-3 py-1 transition-colors ${
                            p.useProcessed
                              ? "bg-surface text-foreground shadow-sm"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          No background
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRemoveBg(p.id)}
                        onMouseEnter={prewarmBgRemoval}
                        disabled={busy || isUploading}
                        className="dm-focus inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-foreground/[0.12] bg-foreground/[0.03] px-3 py-1.5 text-[11px] font-semibold text-foreground/90 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-60"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            {pct > 0 ? `Removing background… ${pct}%` : "Loading model…"}
                          </>
                        ) : (
                          <>
                            <Wand2 className="size-3.5" />
                            Remove background
                          </>
                        )}
                      </button>
                    )}
                    {p.status === "error" && (
                      <p className="text-[11px] text-red-600">{p.errorMsg}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
