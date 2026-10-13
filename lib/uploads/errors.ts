import { toast } from "sonner";
import { MAX_IMAGE_MB } from "./policy";

export type UploadFailure =
  | "too-large"
  | "wrong-type"
  | "too-many"
  | "network"
  | "auth"
  | "stock-photo"
  | "unknown";

/** Thrown by client-side checks so the reason survives to the toast. */
export class UploadProblem extends Error {
  constructor(readonly reason: UploadFailure) {
    super(reason);
  }
}

export function failureMessage(reason: UploadFailure, opts: { count?: number; max?: number; noun?: string } = {}): string {
  const noun = opts.noun ?? "photo";
  const n = opts.count ?? 1;
  switch (reason) {
    case "too-large":
      return n > 1
        ? `${n} ${noun}s are over ${MAX_IMAGE_MB}MB. Pick smaller ones.`
        : `That ${noun} is over ${MAX_IMAGE_MB}MB. Pick a smaller one.`;
    case "wrong-type":
      return "That file isn't a photo we can use. Try a JPG, PNG or HEIC.";
    case "too-many":
      return opts.max === 1
        ? `You can only add one ${noun}.`
        : `You can add up to ${opts.max ?? 3} ${noun}s.`;
    case "network":
      return "Upload didn't finish. Check your connection and try again.";
    case "auth":
      return "Please sign in again to upload.";
    case "stock-photo":
      return "This looks like a stock or downloaded photo. Use one you took yourself.";
    default:
      return `Couldn't upload that ${noun}. Try again.`;
  }
}

/** Map anything thrown by UploadThing, the browser or our checks to one reason. */
export function classifyUploadError(err: unknown): UploadFailure {
  if (err instanceof UploadProblem) return err.reason;
  const e = err as { code?: string; message?: string; name?: string } | null;
  const code = e?.code ?? "";
  const msg = `${e?.message ?? ""}`.toLowerCase();
  if (code === "TOO_LARGE" || msg.includes("filesize") || msg.includes("too large")) return "too-large";
  if (code === "TOO_MANY_FILES" || code === "FILE_LIMIT_EXCEEDED" || msg.includes("toomanyfiles")) return "too-many";
  if (code === "FORBIDDEN" || msg.includes("sign in") || msg.includes("unauthorized")) return "auth";
  if (code === "BAD_REQUEST" && (msg.includes("type") || msg.includes("mime"))) return "wrong-type";
  if (msg.includes("invalidfiletype") || msg.includes("couldn't open")) return "wrong-type";
  if (
    code === "UPLOAD_FAILED" ||
    e?.name === "TypeError" ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return "network";
  }
  return "unknown";
}

/**
 * One toast per kind of failure. Re-firing the same reason replaces the
 * existing toast (same id) instead of stacking.
 */
export function toastUploadFailure(
  reason: UploadFailure,
  opts: { count?: number; max?: number; noun?: string; onRetry?: () => void } = {},
): void {
  toast.error(failureMessage(reason, opts), {
    id: `upload-${reason}`,
    action:
      reason === "network" && opts.onRetry
        ? { label: "Retry", onClick: opts.onRetry }
        : undefined,
  });
}
