"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ImagePlus, UploadCloud, Video as VideoIcon, X } from "lucide-react";
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
  maxItems = 10,
  disabled = false,
}: MediaDropzoneProps) {
  const imageRef = useRef<ImageUploadHandle>(null);
  const videoRef = useRef<VideoUploadHandle>(null);
  const [isDragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const remaining = Math.max(0, maxItems - urls.length);
  const atCapacity = remaining <= 0;

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      const capped = files.slice(0, remaining);
      const { images, videos } = partitionFiles(capped);
      if (images.length && imageRef.current) {
        imageRef.current.submitFiles(images);
      }
      if (videos.length && videoRef.current) {
        void videoRef.current.submitFiles(videos);
      }
    },
    [remaining],
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
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-all hover:bg-black/90 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Remove ${video ? "video" : "photo"}`}
            >
              <X className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          </li>
        );
      }),
    [urls, onRemove],
  );

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {grid}
        </ul>
      ) : null}

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all",
          isDragging
            ? "border-accent bg-accent/10 ring-4 ring-accent/20"
            : "border-border bg-surface-subtle hover:border-accent/40 hover:bg-accent/5",
          disabled || atCapacity ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        aria-disabled={disabled || atCapacity}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <UploadCloud className="size-7" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {atCapacity
                ? "You reached the media limit"
                : isDragging
                  ? "Drop to upload"
                  : "Drag & drop photos or videos"}
            </p>
            <p className="text-xs text-muted">
              {atCapacity
                ? `Maximum ${maxItems} items per listing.`
                : `Or use the buttons below · ${remaining} slot${remaining === 1 ? "" : "s"} left`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <ImageUpload
              ref={imageRef}
              endpoint="imageUploader"
              multiple
              label="Add photos"
              onUploadComplete={(url) => onImageUploaded(url)}
              onUploadManyComplete={(list) => list.forEach(onImageUploaded)}
            />
            <VideoUpload
              ref={videoRef}
              endpoint="productVideo"
              label="Add video"
              onUploadComplete={(url) => onVideoUploaded(url)}
            />
          </div>

          <p className="pt-1 text-[11px] text-muted">
            <ImagePlus className="mr-1 inline size-3" aria-hidden />
            At least 1 photo required · Up to {maxItems} items · Video max 3 min
          </p>
        </div>
      </div>
    </div>
  );
}
