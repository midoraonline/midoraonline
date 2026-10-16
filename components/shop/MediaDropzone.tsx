"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Sparkles, Star, UploadCloud, Video as VideoIcon, X } from "lucide-react";
import { toast } from "sonner";
import { isVideoUrl } from "@/lib/api/products";
import { removeBackground } from "@/lib/api/aiImages";
import { discardUploads } from "@/lib/uploads/discard";
import { ImageUpload, type ImageUploadHandle } from "@/components/image-upload";
import { VideoUpload, type VideoUploadHandle } from "@/components/video-upload";
import MediaLightbox from "@/components/shop/MediaLightbox";

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

function partitionFiles(files: File[]): { images: File[]; videos: File[] } {
  const images: File[] = [];
  const videos: File[] = [];
  for (const f of files) {
    if (f.type.startsWith("video/")) videos.push(f);
    else if (f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)) images.push(f);
  }
  return { images, videos };
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

  /* Pointer-based reorder: works for mouse (after a small move) and touch
     (after a 250ms long press, so normal swipes still scroll the page). */
  const drag = useRef<{
    from: number;
    id: number;
    x: number;
    y: number;
    active: boolean;
    timer: number | null;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const indexAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-media-index]");
    return el ? Number(el.dataset.mediaIndex) : null;
  };

  const stopScroll = useCallback((e: TouchEvent) => {
    if (drag.current?.active) e.preventDefault();
  }, []);

  function endDrag(commit: boolean, e?: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener("touchmove", stopScroll);
    if (!d) return;
    if (d.timer) window.clearTimeout(d.timer);
    if (d.active) {
      suppressClick.current = true;
      if (commit && e) {
        const to = indexAt(e.clientX, e.clientY);
        if (to !== null) moveTo(d.from, to);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function activate() {
    const d = drag.current;
    if (!d) return;
    d.active = true;
    setDragIndex(d.from);
    setOverIndex(d.from);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
  }

  const tileDragHandlers = (i: number) =>
    onReorder && urls.length > 1
      ? {
          onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
            if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
            suppressClick.current = false;
            const touch = e.pointerType !== "mouse";
            drag.current = { from: i, id: e.pointerId, x: e.clientX, y: e.clientY, active: false, timer: null, moved: false };
            if (touch) {
              window.addEventListener("touchmove", stopScroll, { passive: false });
              drag.current.timer = window.setTimeout(() => {
                if (drag.current && !drag.current.moved) {
                  try {
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  } catch {
                    /* capture optional */
                  }
                  activate();
                }
              }, 250);
            }
          },
          onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);
            if (!d.active) {
              if (e.pointerType === "mouse") {
                if (dist > 6) {
                  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                  activate();
                }
              } else if (dist > 8) {
                // Finger moved before the long press: it's a scroll, not a drag.
                d.moved = true;
                endDrag(false);
              }
              return;
            }
            const over = indexAt(e.clientX, e.clientY);
            if (over !== null) setOverIndex(over);
          },
          onPointerUp: (e: React.PointerEvent<HTMLElement>) => endDrag(true, e),
          onPointerCancel: () => endDrag(false),
          onContextMenu: (e: React.MouseEvent) => {
            if (drag.current) e.preventDefault();
          },
        }
      : {};

  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const viewUrl = viewIndex !== null ? urls[viewIndex] : null;
  const ARROW =
    "dm-focus flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30";
  const CHIP_ON = "border-white/60 bg-white text-black";
  const CHIP_OFF = "border-white/30 bg-white/10 text-white hover:bg-white/20";

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <ul
          className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4 sm:grid-cols-5"
          aria-label="Your photos. Drag (long press on phones) or use the arrows to reorder; the first photo is the cover."
        >
          {urls.map((url, i) => {
            const video = isVideoUrl(url);
            const isCover = i === firstImageIndex;
            const processed = Boolean(originals[url]);
            const wide = fullWidth.includes(url);
            const dragging = dragIndex === i;
            const target = dragIndex !== null && overIndex === i && !dragging;
            return (
              <li
                key={url}
                data-media-index={i}
                {...tileDragHandlers(i)}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setViewIndex(i);
                }}
                style={{ WebkitTouchCallout: "none" }}
                className={[
                  "group relative aspect-square cursor-pointer select-none overflow-hidden rounded-xl border bg-surface-subtle shadow-xs transition",
                  onReorder ? "active:cursor-grabbing" : "",
                  dragging ? "scale-95 border-accent opacity-60" : "border-border",
                  target ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "",
                  dragIndex !== null ? "touch-none" : "",
                ].join(" ")}
              >
                {video ? (
                  <video src={url} muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
                  <img src={url} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
                )}
                {video ? (
                  <span className="pointer-events-none absolute bottom-1 left-1 inline-flex items-center rounded bg-black/70 p-1 text-white">
                    <VideoIcon className="size-3" aria-hidden />
                    <span className="sr-only">Video</span>
                  </span>
                ) : null}
                {isCover ? (
                  <span className="pointer-events-none absolute left-1 top-1 inline-flex items-center gap-0.5 rounded border border-border bg-surface/95 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                    <Star className="size-2.5 fill-accent text-accent" aria-hidden />
                    Cover
                  </span>
                ) : null}
                {!video && (processed || wide) ? (
                  <span className="pointer-events-none absolute bottom-1 left-1 flex gap-0.5">
                    {processed ? (
                      <span className="rounded bg-accent p-0.5 text-white" title="Background removed">
                        <Sparkles className="size-3" aria-hidden />
                      </span>
                    ) : null}
                    {wide ? (
                      <span className="rounded bg-accent p-0.5 text-white" title="Full width on listing">
                        <Maximize2 className="size-3" aria-hidden />
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {bgBusy[url] ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const orig = originals[url];
                    discardUploads(orig ? [url, orig] : [url]);
                    if (wide) onToggleFullWidth?.(url, false);
                    onRemove(i);
                  }}
                  className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                  aria-label={`Remove ${video ? "video" : "photo"} ${i + 1}`}
                >
                  <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                </button>
                {onReorder && urls.length > 1 ? (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTo(i, i - 1);
                      }}
                      disabled={i === 0}
                      className={ARROW}
                      aria-label={`Move ${video ? "video" : "photo"} ${i + 1} earlier`}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTo(i, i + 1);
                      }}
                      disabled={i === urls.length - 1}
                      className={ARROW}
                      aria-label={`Move ${video ? "video" : "photo"} ${i + 1} later`}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {urls.length > 0 ? (
        <p className="text-[11px] text-muted">
          Tap a photo to view it full size and set options. Hold and drag (or use the arrows) to reorder. The first photo is the cover.
        </p>
      ) : null}

      {viewIndex !== null && viewUrl ? (
        <MediaLightbox
          urls={urls}
          index={viewIndex}
          onIndexChange={setViewIndex}
          onClose={() => setViewIndex(null)}
          footer={
            !isVideoUrl(viewUrl) && (onReplace || onToggleFullWidth) ? (
              <>
                {onToggleFullWidth ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fullWidth.includes(viewUrl)}
                    onClick={() => onToggleFullWidth(viewUrl, !fullWidth.includes(viewUrl))}
                    className={`dm-focus inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
                      fullWidth.includes(viewUrl) ? CHIP_ON : CHIP_OFF
                    }`}
                  >
                    <Maximize2 className="size-4" aria-hidden />
                    Show full width on listing
                  </button>
                ) : null}
                {onReplace ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(originals[viewUrl])}
                    disabled={Boolean(bgBusy[viewUrl])}
                    onClick={() => void toggleBackground(viewIndex, viewUrl, !originals[viewUrl])}
                    className={`dm-focus inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium disabled:opacity-60 ${
                      originals[viewUrl] ? CHIP_ON : CHIP_OFF
                    }`}
                  >
                    {bgBusy[viewUrl] ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                    Remove background
                  </button>
                ) : null}
              </>
            ) : null
          }
        />
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
            {photosRequired ? "At least 2 photos to publish" : "Photos optional"} · The first photo is the cover.
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
