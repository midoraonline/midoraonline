"use client";

/**
 * VideoUpload
 *
 * Pick-one-or-more video files, compress them in-browser with ffmpeg.wasm,
 * then upload the smaller MP4(s) through UploadThing.  The compressor is
 * lazy-loaded — the ~30MB wasm core only downloads the first time a user
 * actually kicks off a transcode.
 *
 * UX: at every stage the user sees progress.  Picking files immediately
 * renders a review panel that scrolls into view, each tile shows its own
 * compression progress bar, and during the actual upload a global progress
 * bar is shown.  A green "Uploaded …" banner confirms success before the
 * queue clears.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Video as VideoIcon, X } from "lucide-react";
import { getUploadThingAuthHeaders, useUploadThing } from "@/lib/uploadthing";
import {
  compressVideo,
  formatBytes,
  probeVideoDuration,
  type CompressProgress,
} from "@/lib/videoCompress";

type Endpoint = "productVideo";

type Props = {
  endpoint: Endpoint;
  onUploadComplete?: (url: string) => void;
  onUploadManyComplete?: (urls: string[]) => void;
  label?: string;
  className?: string;
  multiple?: boolean;
  /** Reject videos longer than this many seconds (default 180 = 3 minutes). */
  maxDurationSeconds?: number;
};

type PendingVideo = {
  id: string;
  original: File;
  previewUrl: string;
  duration: number | null;
  compressed?: Blob;
  compressedSize?: number;
  status: "idle" | "compressing" | "ready" | "error";
  progress?: CompressProgress;
  error?: string;
};

export function VideoUpload({
  endpoint,
  onUploadComplete,
  onUploadManyComplete,
  label = "Upload video",
  className = "",
  multiple = false,
  maxDurationSeconds = 180,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [queue, setQueue] = useState<PendingVideo[]>([]);
  const [topError, setTopError] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [lastSuccessCount, setLastSuccessCount] = useState(0);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: getUploadThingAuthHeaders,
    onUploadBegin: () => {
      setUploadPct(0);
      setTopError(null);
    },
    onUploadProgress: (p) => setUploadPct(Math.round(p)),
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((r) => r.ufsUrl ?? r.url)
        .filter((u): u is string => Boolean(u));
      if (onUploadManyComplete && urls.length) onUploadManyComplete(urls);
      else if (urls[0] && onUploadComplete) onUploadComplete(urls[0]);

      setLastSuccessCount(urls.length);
      setUploadPct(100);
      setQueue((list) => {
        for (const v of list) URL.revokeObjectURL(v.previewUrl);
        return [];
      });
    },
    onUploadError: (e) => {
      setUploadPct(0);
      setTopError(e.message);
    },
  });

  // Auto-dismiss the success banner
  useEffect(() => {
    if (!lastSuccessCount) return;
    const t = setTimeout(() => setLastSuccessCount(0), 4500);
    return () => clearTimeout(t);
  }, [lastSuccessCount]);

  // Scroll review into view when it first appears so users see the controls
  useEffect(() => {
    if (queue.length > 0 && reviewRef.current) {
      reviewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [queue.length]);

  const update = useCallback((id: string, patch: Partial<PendingVideo>) => {
    setQueue((list) => list.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  async function queueFile(file: File) {
    const duration = await probeVideoDuration(file);
    if (duration !== null && duration > maxDurationSeconds) {
      setTopError(
        `Video is ${Math.round(duration)}s — please trim to under ${maxDurationSeconds}s.`
      );
      return null;
    }
    const pending: PendingVideo = {
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      original: file,
      previewUrl: URL.createObjectURL(file),
      duration,
      status: "idle",
    };
    setQueue((list) => [...list, pending]);
    return pending;
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Snapshot into a real Array before clearing — FileList is a live DOM
    // object that becomes empty once input.value is reset.
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setTopError(null);
    setLastSuccessCount(0);
    e.target.value = "";

    for (const file of files) {
      const pending = await queueFile(file);
      if (!pending) continue;
      void compressOne(pending);
    }
  }

  async function compressOne(pending: PendingVideo) {
    update(pending.id, { status: "compressing", progress: undefined, error: undefined });
    try {
      const result = await compressVideo(pending.original, {
        onProgress: (p) => update(pending.id, { progress: p }),
      });
      update(pending.id, {
        status: "ready",
        compressed: result.blob,
        compressedSize: result.compressedSize,
        progress: { stage: "finalizing", percent: 100 },
      });
    } catch (e) {
      update(pending.id, {
        status: "error",
        error:
          e instanceof Error
            ? e.message
            : "Compression failed — you can still upload the original.",
      });
    }
  }

  function discard(id: string) {
    setQueue((list) => {
      const gone = list.find((v) => v.id === id);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return list.filter((v) => v.id !== id);
    });
  }

  function retry(id: string) {
    const target = queue.find((v) => v.id === id);
    if (target) void compressOne(target);
  }

  async function confirmUpload() {
    if (isUploading || !queue.length) return;
    setUploadPct(0);
    const files: File[] = queue.map((v) => {
      if (v.compressed) {
        const stem = v.original.name.replace(/\.[^.]+$/, "");
        return new File([v.compressed], `${stem}.mp4`, { type: "video/mp4" });
      }
      return v.original;
    });
    startUpload(files);
  }

  const queueCount = queue.length;
  const allDone = queueCount > 0 && queue.every((v) => v.status !== "compressing");
  const anyBusy = queue.some((v) => v.status === "compressing");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/*"
          multiple={multiple}
          className="hidden"
          aria-hidden
          onChange={(e) => void handleChange(e)}
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="dm-pill dm-focus inline-flex items-center gap-1.5 border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading… {uploadPct}%
            </>
          ) : (
            <>
              <VideoIcon className="size-4" />
              {label}
            </>
          )}
        </button>
        <p className="text-[11px] text-muted">
          Auto-compressed to 720p MP4 in your browser. Max {Math.round(maxDurationSeconds / 60)} min.
        </p>
      </div>

      {/* Global upload bar */}
      {isUploading && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      )}

      {topError && <p className="mt-2 text-xs text-red-600">{topError}</p>}

      {lastSuccessCount > 0 && !isUploading && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 dark:bg-green-950/40 dark:text-green-200">
          <CheckCircle2 className="size-4" />
          Uploaded {lastSuccessCount} {lastSuccessCount === 1 ? "video" : "videos"} — see {lastSuccessCount === 1 ? "it" : "them"} in the list below.
        </div>
      )}

      {queueCount > 0 && (
        <div
          ref={reviewRef}
          className="mt-4 space-y-3 rounded-2xl border border-primary/30 bg-surface/80 p-3 shadow-sm ring-1 ring-primary/5 backdrop-blur-sm sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground/90">
                {queueCount === 1 ? "Your video" : `Your ${queueCount} videos`}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {anyBusy
                  ? "Compressing in your browser — nothing is sent until you tap Upload."
                  : "Ready to upload. Tap Upload when you're happy with the size savings."}
              </p>
            </div>
            <button
              type="button"
              onClick={confirmUpload}
              disabled={isUploading || !allDone}
              className="dm-pill dm-focus inline-flex shrink-0 items-center gap-1.5 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading {uploadPct}%
                </>
              ) : allDone ? (
                `Upload ${queueCount > 1 ? "all" : ""}`
              ) : (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Compressing…
                </>
              )}
            </button>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {queue.map((v) => {
              const pct = v.progress?.percent ?? 0;
              const savings =
                v.compressedSize && v.original.size > 0
                  ? Math.max(
                      0,
                      Math.round(
                        ((v.original.size - v.compressedSize) / v.original.size) * 100
                      )
                    )
                  : 0;
              return (
                <li
                  key={v.id}
                  className="relative overflow-hidden rounded-xl border border-foreground/[0.08] bg-background"
                >
                  <div className="relative aspect-video w-full bg-black">
                    <video
                      src={v.previewUrl}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      className="h-full w-full object-contain"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => discard(v.id)}
                      disabled={isUploading}
                      className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/80 dm-focus disabled:opacity-50"
                      aria-label="Discard"
                      title="Discard"
                    >
                      <X className="size-4" strokeWidth={2.25} />
                    </button>
                    {v.status === "ready" && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
                        <CheckCircle2 className="size-3" /> Ready
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 p-3">
                    <p className="truncate text-xs text-muted" title={v.original.name}>
                      {v.original.name}
                      {v.duration != null && (
                        <span className="ml-1">· {Math.round(v.duration)}s</span>
                      )}
                    </p>

                    {v.status === "compressing" && (
                      <div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1 text-foreground/70">
                            <Loader2 className="size-3 animate-spin" />
                            {v.progress?.message ?? "Compressing…"}
                          </span>
                          <span className="tabular-nums text-foreground/70">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {v.status === "ready" && (
                      <p className="text-[11px]">
                        <span className="font-semibold text-foreground/85">
                          {formatBytes(v.compressedSize ?? 0)}
                        </span>
                        <span className="ml-1 text-muted">
                          (was {formatBytes(v.original.size)}
                          {savings > 0 ? ` — saved ${savings}%` : ""})
                        </span>
                      </p>
                    )}

                    {v.status === "error" && (
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <p className="text-red-600">{v.error}</p>
                        <button
                          type="button"
                          onClick={() => retry(v.id)}
                          className="dm-focus shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 font-semibold text-foreground/80 hover:bg-foreground/[0.1]"
                        >
                          Retry
                        </button>
                      </div>
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
