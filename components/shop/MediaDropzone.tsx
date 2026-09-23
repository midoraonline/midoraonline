"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, UploadCloud, Video as VideoIcon, X } from "lucide-react";
import { isVideoUrl } from "@/lib/api/products";
import {
  ImageUpload,
  type ImageUploadHandle,
} from "@/components/image-upload";
import {
  VideoUpload,
  type VideoUploadHandle,
} from "@/components/video-upload";

type MediaDropzoneProps = {
  urls: string[];
  onImageUploaded: (url: string) => void;
  onVideoUploaded: (url: string) => void;
  onRemove: (index: number) => void;
  onSetCover?: (index: number) => void;
  maxItems?: number;
  disabled?: boolean;
};

function partitionFiles(files: File[]): { images: File[]; videos: File[] } {
  const images: File[] = [];
  const videos: File[] = [];
  for (const f of files) {
    if (f.type.startsWith("video/")) videos.push(f);
    else if (f.type.startsWith("image/")) images.push(f);
  }
  return { images, videos };
}

export function MediaDropzone({
  urls,
  onImageUploaded,
  onVideoUploaded,
  onRemove,
  onSetCover,
  maxItems = 3,
  disabled = false,
}: MediaDropzoneProps) {
  const imageRef = useRef<ImageUploadHandle>(null);
  const videoRef = useRef<VideoUploadHandle>(null);
  const [isDragging, setDragging] = useState(false);
  const [busyHint, setBusyHint] = useState(false);
  const dragCounter = useRef(0);

  const remaining = Math.max(0, maxItems - urls.length);
  const atCapacity = remaining <= 0;

  const pollBusy = useCallback(() => {
    const tick = () => {
      const busy = Boolean(imageRef.current?.isBusy() || videoRef.current?.isBusy());
      setBusyHint(busy);
      if (busy) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      const capped = files.slice(0, remaining);
      const { images, videos } = partitionFiles(capped);
      if (images.length && imageRef.current) {
        imageRef.current.submitFiles(images);
        pollBusy();
      }
      if (videos.length && videoRef.current) {
        void videoRef.current.submitFiles(videos);
        pollBusy();
      }
    },
    [remaining, pollBusy],
  );

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || atCapacity) return;
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !atCapacity) e.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    if (disabled || atCapacity) return;
    handleFiles(e.dataTransfer.files);
  };

  const grid = useMemo(
    () =>
      urls.map((url, i) => {
        const video = isVideoUrl(url);
        const isCover = i === 0 && !video;
        return (
          <li
            key={`${url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-xs"
          >
            {video ? (
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
            {video ? (
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-xs">
                <VideoIcon className="size-3" aria-hidden />
                Video
              </span>
            ) : null}
            {isCover ? (
              <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                <Star className="size-3 fill-current" aria-hidden />
                Cover
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              {!video && i > 0 && onSetCover ? (
                <button
                  type="button"
                  onClick={() => onSetCover(i)}
                  className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm"
                >
                  <Star className="size-3" aria-hidden />
                  Set cover
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                aria-label={`Remove ${video ? "video" : "photo"}`}
              >
                <X className="size-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </li>
        );
      }),
    [urls, onRemove, onSetCover],
  );

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-3">
          {grid}
        </ul>
      ) : null}

      {busyHint ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden />
          Preparing media…
        </div>
      ) : null}

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative rounded-2xl border-2 border-dashed p-5 sm:p-7 text-center transition-all",
          isDragging
            ? "border-accent bg-accent/10 ring-4 ring-accent/20"
            : "border-border bg-surface-subtle hover:border-accent/40 hover:bg-accent/5",
          disabled || atCapacity ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        aria-disabled={disabled || atCapacity}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <UploadCloud className="size-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {atCapacity
                ? "Photo limit reached"
                : isDragging
                  ? "Drop to upload"
                  : "Add photos"}
            </p>
            <p className="text-xs text-muted">
              {atCapacity
                ? `Maximum ${maxItems} photos per listing.`
                : `${remaining} of ${maxItems} slots left · drag & drop or use buttons`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <ImageUpload
              ref={imageRef}
              endpoint="productImage"
              multiple
              label="Add photos"
              onUploadComplete={(url) => {
                onImageUploaded(url);
                setBusyHint(false);
              }}
              onUploadManyComplete={(list) => {
                list.forEach(onImageUploaded);
                setBusyHint(false);
              }}
            />
            <VideoUpload
              ref={videoRef}
              endpoint="productVideo"
              label="Add video"
              onUploadComplete={(url) => {
                onVideoUploaded(url);
                setBusyHint(false);
              }}
            />
          </div>

          <p className="pt-1 text-[11px] text-muted">
            <ImagePlus className="mr-1 inline size-3" aria-hidden />
            At least 2 photos to publish · Max {maxItems} · First / Set cover = listing card
          </p>
        </div>
      </div>
    </div>
  );
}
