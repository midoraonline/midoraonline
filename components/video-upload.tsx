"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { getUploadThingAuthHeaders, useUploadThing } from "@/lib/uploadthing";
import { tagVideoUrl } from "@/lib/api/products";
import {
  compressVideo,
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
  maxDurationSeconds?: number;
};

type Stage = "compressing" | "uploading";

/**
 * Video picker with a single-tap upload flow.
 *
 * Contract:
 * - Picking a file triggers browser compression (~720p MP4), then auto-uploads
 *   as soon as compression completes. No user confirmation click required.
 * - Duration cap enforced before compression.
 * - Success / failure reported via sonner (see AppToaster).
 */
export function VideoUpload({
  endpoint,
  onUploadComplete,
  onUploadManyComplete,
  label = "Add video",
  className = "",
  multiple = false,
  maxDurationSeconds = 180,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [stageMsg, setStageMsg] = useState<string>("");
  const [stagePct, setStagePct] = useState<number>(0);
  const [uploadPct, setUploadPct] = useState(0);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: getUploadThingAuthHeaders,
    onUploadBegin: () => {
      setStage("uploading");
      setUploadPct(0);
    },
    onUploadProgress: (p) => setUploadPct(Math.round(p)),
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((r) => r.ufsUrl ?? r.url)
        .filter((u): u is string => Boolean(u))
        .map(tagVideoUrl);
      if (onUploadManyComplete && urls.length) onUploadManyComplete(urls);
      else if (urls[0] && onUploadComplete) onUploadComplete(urls[0]);
      setStage(null);
      setStagePct(0);
      setUploadPct(0);
      if (urls.length) {
        toast.success(
          urls.length === 1 ? "Video uploaded" : `${urls.length} videos uploaded`,
        );
      }
    },
    onUploadError: (e) => {
      setStage(null);
      setUploadPct(0);
      toast.error("Video upload failed", { description: e.message });
    },
  });

  const compressAndUpload = useCallback(
    async (files: File[]) => {
      const outFiles: File[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setStage("compressing");
        setStageMsg(
          files.length > 1 ? `Compressing ${i + 1}/${files.length}` : "Compressing",
        );
        setStagePct(0);
        try {
          const result = await compressVideo(file, {
            onProgress: (p: CompressProgress) => setStagePct(p.percent),
          });
          const stem = file.name.replace(/\.[^.]+$/, "");
          outFiles.push(
            new File([result.blob], `${stem}.mp4`, { type: "video/mp4" }),
          );
        } catch (err) {
          const description =
            err instanceof Error
              ? err.message
              : "Compression failed — uploading original file.";
          toast.warning("Uploading original", { description });
          outFiles.push(file);
        }
      }
      if (outFiles.length) startUpload(outFiles);
    },
    [startUpload],
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    // Duration gate — reject anything past the cap before compressing.
    const accepted: File[] = [];
    for (const file of files) {
      const duration = await probeVideoDuration(file);
      if (duration !== null && duration > maxDurationSeconds) {
        toast.error("Video too long", {
          description: `Trim to under ${Math.round(maxDurationSeconds / 60)} min (${Math.round(duration)}s currently).`,
        });
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;
    void compressAndUpload(accepted);
  };

  const busy = stage !== null;

  const buttonLabel = (() => {
    if (stage === "uploading" || isUploading) return `Uploading… ${uploadPct}%`;
    if (stage === "compressing") return `${stageMsg}… ${stagePct}%`;
    return label;
  })();

  const progressPct =
    stage === "uploading" || isUploading ? uploadPct : stage === "compressing" ? stagePct : 0;

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
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="dm-btn dm-btn-secondary dm-btn-sm"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {buttonLabel}
            </>
          ) : (
            <>
              <VideoIcon className="size-4" aria-hidden="true" />
              {buttonLabel}
            </>
          )}
        </button>
        <p className="text-[11px] text-muted">
          Compressed to 720p MP4 in your browser. Max{" "}
          {Math.round(maxDurationSeconds / 60)} min.
        </p>
      </div>

      {progressPct > 0 && busy ? (
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-surface-subtle"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
