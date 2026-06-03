"use client";

import type { FFmpeg } from "@ffmpeg/ffmpeg";

type FFmpegModule = typeof import("@ffmpeg/ffmpeg");
type UtilModule = typeof import("@ffmpeg/util");

let ffmpegPromise: Promise<FFmpeg> | null = null;
let utilPromise: Promise<UtilModule> | null = null;

const FFMPEG_CORE_VERSION = "0.12.10";
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

async function loadUtil(): Promise<UtilModule> {
  if (!utilPromise) utilPromise = import("@ffmpeg/util");
  return utilPromise;
}

async function getFFmpeg(
  onProgress?: (pct: number) => void,
  onLog?: (msg: string) => void
): Promise<FFmpeg> {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const [mod, util] = await Promise.all([
      import("@ffmpeg/ffmpeg") as Promise<FFmpegModule>,
      loadUtil(),
    ]);
    const ff = new mod.FFmpeg();

    ff.on("progress", ({ progress }: { progress: number; time: number }) => {
      const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
      onProgress?.(pct);
    });
    ff.on("log", ({ message }: { message: string }) => onLog?.(message));

    await ff.load({
      coreURL: await util.toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await util.toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    return ff;
  })();

  try {
    return await ffmpegPromise;
  } catch (e) {
    ffmpegPromise = null;
    throw e;
  }
}

export function resetFFmpeg(): void {
  ffmpegPromise = null;
}

export type VideoCompressionProfile = {
  maxEdge: number;
  crf: number;
  preset:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow";
  audioBitrate: string;
};

export const DEFAULT_PROFILE: VideoCompressionProfile = {
  maxEdge: 1280,
  crf: 28,
  preset: "veryfast",
  audioBitrate: "96k",
};

export type CompressProgress = {
  stage: "loading" | "transcoding" | "finalizing";
  percent: number;
  message?: string;
};

export type CompressionResult = {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  durationMs: number;
};

export function probeVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : null;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

export async function compressVideo(
  file: File,
  opts: {
    profile?: Partial<VideoCompressionProfile>;
    onProgress?: (p: CompressProgress) => void;
  } = {}
): Promise<CompressionResult> {
  const started = Date.now();
  const profile: VideoCompressionProfile = { ...DEFAULT_PROFILE, ...(opts.profile ?? {}) };

  opts.onProgress?.({ stage: "loading", percent: 0, message: "Preparing compressor…" });
  const util = await loadUtil();

  const ff = await getFFmpeg((pct) => {
    opts.onProgress?.({ stage: "transcoding", percent: pct });
  });

  const inputName = "input" + (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".mp4");
  const outputName = "output.mp4";

  try {
    const inputData = await util.fetchFile(file);
    await ff.writeFile(inputName, inputData);

    opts.onProgress?.({ stage: "transcoding", percent: 0, message: "Transcoding…" });

    const scale = `scale='if(gt(iw,ih),min(${profile.maxEdge},iw),-2)':'if(gt(ih,iw),min(${profile.maxEdge},ih),-2)',scale=trunc(iw/2)*2:trunc(ih/2)*2`;

    await ff.exec([
      "-i",
      inputName,
      "-vf",
      scale,
      "-c:v",
      "libx264",
      "-crf",
      String(profile.crf),
      "-preset",
      profile.preset,
      "-profile:v",
      "main",
      "-level",
      "4.0",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      profile.audioBitrate,
      "-ac",
      "2",
      "-y",
      outputName,
    ]);

    opts.onProgress?.({ stage: "finalizing", percent: 99, message: "Wrapping up…" });
    const out = (await ff.readFile(outputName)) as Uint8Array;
    const arrayBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: "video/mp4" });

    opts.onProgress?.({ stage: "finalizing", percent: 100, message: "Done" });

    return {
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
      durationMs: Date.now() - started,
    };
  } finally {
    try {
      await ff.deleteFile(inputName);
    } catch {
      /* noop */
    }
    try {
      await ff.deleteFile(outputName);
    } catch {
      /* noop */
    }
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
