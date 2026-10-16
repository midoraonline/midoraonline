"use client";

import { useCallback, useRef, useState } from "react";
import { GripVertical, Loader2, Maximize2, Sparkles, Star, UploadCloud, Video as VideoIcon, X } from "lucide-react";
import { toast } from "sonner";
import { isVideoUrl } from "@/lib/api/products";
import { removeBackground } from "@/lib/api/aiImages";
import { discardUploads } from "@/lib/uploads/discard";
import { ImageUpload, type ImageUploadHandle } from "@/components/image-upload";
import { VideoUpload, type VideoUploadHandle } from "@/components/video-upload";

type MediaDropzoneProps = {
  urls: string[];
  onImageUploaded: (url: string) => void;
  onVideoUploaded: (url: string) => void;
  onRemove: (index: number) => void;
  /** Move the item at `from` to position `to`. The first photo is the cover. */
  onReorder?: (from: number, to: number) => void;
  /** Swap one URL for another (server-side background removal and its undo). */
  onReplace?: (index: number, url: string) => void;
  /** URLs shown full width (uncropped) on the listing page. */
  fullWidth?: string[];
  onToggleFullWidth?: (url: string, on: boolean) => void;
  maxPhotos?: number;
  maxVideos?: number;
  /** Products need photos to publish. Services and opportunities do not. */
  photosRequired?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Poster's plan name for the "Your plan allows…" hint. */
  planName?: string;
  /** Where to upgrade for higher limits. */
  upgradeHref?: string;
};

const REORDER_TYPE = "application/x-midora-media-index";

function partitionFiles(files: File[]): { images: File[]; videos: File[] } {
  const images: File[] = [];
  const videos: File[] = [];
  for (const f of files) {
    if (f.type.startsWith("video/")) videos.push(f);
    else if (f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)) images.push(f);
  }
  return { images, videos };
}

function Toggle({
  label,
  icon,
  checked,
  busy,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={busy}
      onClick={() => onChange(!checked)}
      className={[
        "dm-focus inline-flex min-h-8 w-full items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors",
        checked
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-surface text-foreground-muted hover:border-accent/40",
      ].join(" ")}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function MediaDropzone({
  urls,
  onImageUploaded,
  onVideoUploaded,
  onRemove,
  onReorder,
  onReplace,
  fullWidth = [],
  onToggleFullWidth,
  maxPhotos = 3,
  maxVideos = 1,
  photosRequired = true,
  disabled = false,
  invalid = false,
  planName,
  upgradeHref,
}: MediaDropzoneProps) {
  const imageRef = useRef<ImageUploadHandle>(null);
  const videoRef = useRef<VideoUploadHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [bgBusy, setBgBusy] = useState<Record<string, boolean>>({});
  /** processed URL -> original URL, so the toggle can be undone. */
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const dragCounter = useRef(0);

  const photoCount = urls.filter((u) => !isVideoUrl(u)).length;
  const videoCount = urls.length - photoCount;
  const photosLeft = Math.max(0, maxPhotos - photoCount);
  const videosLeft = Math.max(0, maxVideos - videoCount);
  const atCapacity = photosLeft <= 0 && videosLeft <= 0;
  const firstImageIndex = urls.findIndex((url) => !isVideoUrl(url));

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const { images, videos } = partitionFiles(Array.from(fileList));
      if (images.length > photosLeft) {
        toast.message(`Only ${maxPhotos} ${maxPhotos === 1 ? "photo" : "photos"} per listing`, {
          description: photosLeft ? `Added the first ${photosLeft}.` : "Remove one to add another.",
        });
      }
      if (videos.length > videosLeft) {
        toast.message(maxVideos ? `Only ${maxVideos} ${maxVideos === 1 ? "video" : "videos"} per listing` : "Videos aren't allowed on listings right now");
      }
      const pickedImages = images.slice(0, photosLeft);
      const pickedVideos = videos.slice(0, videosLeft);
      if (pickedImages.length) imageRef.current?.submitFiles(pickedImages);
      if (pickedVideos.length) void videoRef.current?.submitFiles(pickedVideos);
    },
    [photosLeft, videosLeft, maxPhotos, maxVideos],
  );

  const openPicker = () => {
    if (disabled || atCapacity) return;
    fileRef.current?.click();
  };

  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  const zoneHandlers = {
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (disabled || atCapacity) return;
      dragCounter.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (!disabled && !atCapacity) e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      if (disabled || atCapacity) return;
      handleFiles(e.dataTransfer.files);
    },
  };

  async function toggleBackground(index: number, url: string, on: boolean) {
    if (!onReplace) return;
    if (!on) {
      const original = originals[url];
      if (!original) return;
      onReplace(index, original);
      discardUploads([url]);
      setOriginals((m) => {
        const next = { ...m };
        delete next[url];
        return next;
      });
      return;
    }
    setBgBusy((m) => ({ ...m, [url]: true }));
    try {
      const res = await removeBackground({ image_url: url, bg_color: "#ffffff" });
      const next = res?.image_url;
      if (!next) throw new Error("No photo came back.");
      setOriginals((m) => ({ ...m, [next]: url }));
      onReplace(index, next);
      if (fullWidth.includes(url)) {
        onToggleFullWidth?.(url, false);
        onToggleFullWidth?.(next, true);
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Couldn't remove the background. Try again.");
    } finally {
      setBgBusy((m) => {
        const next = { ...m };
        delete next[url];
        return next;
      });
    }
  }

  function moveTo(from: number, to: number) {
    if (!onReorder || from === to || to < 0 || to >= urls.length) return;
    onReorder(from, to);
  }

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Your photos. Drag to reorder; the first photo is the cover.">
          {urls.map((url, i) => {
            const video = isVideoUrl(url);
            const isCover = i === firstImageIndex;
            const processed = Boolean(originals[url]);
            const wide = fullWidth.includes(url);
            return (
              <li
                key={url}
                draggable={Boolean(onReorder)}
                onDragStart={(e) => {
                  e.dataTransfer.setData(REORDER_TYPE, String(i));
                  e.dataTransfer.effectAllowed = "move";
                  setDragIndex(i);
                }}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(REORDER_TYPE)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverIndex(i);
                }}
                onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                onDrop={(e) => {
                  const raw = e.dataTransfer.getData(REORDER_TYPE);
                  if (!raw) return;
                  e.preventDefault();
                  moveTo(Number(raw), i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={[
                  "space-y-1.5 rounded-2xl transition-opacity",
                  dragIndex === i ? "opacity-50" : "",
                  overIndex === i && dragIndex !== i ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "",
                ].join(" ")}
              >
                <div className="group relative aspect-square cursor-grab overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-xs active:cursor-grabbing">
                  {video ? (
                    <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
                    <img src={url} alt="" draggable={false} className={`h-full w-full ${wide ? "object-contain" : "object-cover"}`} />
                  )}
                  {video ? (
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <VideoIcon className="size-3" aria-hidden />
                      Video
                    </span>
                  ) : null}
                  {isCover ? (
                    <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md border border-border bg-surface/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                      <Star className="size-3 fill-accent text-accent" aria-hidden />
                      Cover
                    </span>
                  ) : null}
                  {onReorder ? (
                    <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white" aria-hidden>
                      <GripVertical className="size-4" />
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      const orig = originals[url];
                      discardUploads(orig ? [url, orig] : [url]);
                      if (wide) onToggleFullWidth?.(url, false);
                      onRemove(i);
                    }}
                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                    aria-label={`Remove ${video ? "video" : "photo"} ${i + 1}`}
                  >
                    <X className="size-4" strokeWidth={2.5} aria-hidden />
                  </button>
                  {onReorder ? (
                    <div className="sr-only">
                      <button type="button" onClick={() => moveTo(i, i - 1)} disabled={i === 0}>
                        Move earlier
                      </button>
                      <button type="button" onClick={() => moveTo(i, i + 1)} disabled={i === urls.length - 1}>
                        Move later
                      </button>
                    </div>
                  ) : null}
                </div>
                {!video ? (
                  <div className="grid gap-1">
                    {onReplace ? (
                      <Toggle
                        label="Remove background"
                        icon={<Sparkles className="size-3.5" aria-hidden />}
                        checked={processed}
                        busy={Boolean(bgBusy[url])}
                        onChange={(next) => void toggleBackground(i, url, next)}
                      />
                    ) : null}
                    {onToggleFullWidth ? (
                      <Toggle
                        label="Full-width view"
                        icon={<Maximize2 className="size-3.5" aria-hidden />}
                        checked={wide}
                        onChange={(next) => onToggleFullWidth(url, next)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div
        {...zoneHandlers}
        role="button"
        tabIndex={disabled || atCapacity ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        aria-disabled={disabled || atCapacity}
        aria-label={atCapacity ? "Photo limit reached" : "Add photo"}
        className={[
          "dm-focus relative cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all sm:p-7",
          isDragging
            ? "border-accent bg-accent/10 ring-4 ring-accent/20"
            : invalid
              ? "border-[color:var(--error)] bg-[color:var(--error)]/5"
              : "border-border bg-surface-subtle hover:border-accent/40 hover:bg-accent/5",
          disabled || atCapacity ? "pointer-events-none cursor-default opacity-60" : "",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <UploadCloud className="size-6" aria-hidden />
          </div>
          <p className="text-sm font-bold text-foreground">
            {atCapacity ? "Photo limit reached" : isDragging ? "Drop to upload" : "Add photo"}
          </p>
          <p className="text-xs text-muted">
            {atCapacity
              ? `Maximum ${maxPhotos} ${maxPhotos === 1 ? "photo" : "photos"}${maxVideos ? ` and ${maxVideos} ${maxVideos === 1 ? "video" : "videos"}` : ""} per listing.`
              : `Tap to choose, or drag & drop. ${photosLeft} of ${maxPhotos} photos left${maxVideos ? ` · ${videosLeft} video${videosLeft === 1 ? "" : "s"} left` : ""}.`}
          </p>
          <p className="text-[11px] text-muted">
            {photosRequired ? "At least 2 photos to publish" : "Photos optional"} · The first photo is the cover. Drag to reorder.
          </p>
        </div>
      </div>

      {planName ? (
        <p className="text-xs text-muted">
          Your {planName} plan allows {maxPhotos} {maxPhotos === 1 ? "photo" : "photos"}
          {maxVideos ? ` and ${maxVideos} ${maxVideos === 1 ? "video" : "videos"}` : ""} per ad.
          {upgradeHref ? (
            <>
              {" "}
              <a href={upgradeHref} className="font-medium text-accent underline underline-offset-2">
                Upgrade for more
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={maxVideos > 0 ? "image/*,.heic,.heif,video/*" : "image/*,.heic,.heif"}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          handleFiles(files);
        }}
      />
      <ImageUpload
        ref={imageRef}
        endpoint="productImage"
        multiple
        hideButton
        maxFiles={maxPhotos}
        existingCount={photoCount}
        onUploadComplete={onImageUploaded}
        onUploadManyComplete={(list) => list.forEach(onImageUploaded)}
      />
      {maxVideos > 0 ? (
        <VideoUpload ref={videoRef} endpoint="productVideo" hideButton onUploadComplete={onVideoUploaded} />
      ) : null}
    </div>
  );
}
