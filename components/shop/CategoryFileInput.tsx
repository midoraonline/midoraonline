"use client";

import { useEffect, useRef, useState } from "react";
import { getUploadThingAuthHeaders, uploadFiles } from "@/lib/uploadthing";
import { discardUploads } from "@/lib/uploads/discard";
import { classifyUploadError, failureMessage } from "@/lib/uploads/errors";
import {
  acceptAttribute,
  describeAccept,
  fileProblem,
  fileSpecOf,
  fileTypeLabel,
  formatFileSize,
  mimeFor,
  parseFileValue,
  type FileFieldValue,
  type FileMetaField,
} from "@/lib/listingAttachment";

/** Pick → upload with progress → name/size with Replace and Remove. Value is `{ url, name, size, mime }`. */
export default function CategoryFileInput({
  field,
  value,
  labelId,
  error,
  onChange,
}: {
  field: FileMetaField;
  value: unknown;
  labelId: string;
  error?: string;
  onChange: (value: FileFieldValue | undefined) => void;
}) {
  const spec = fileSpecOf(field);
  const current = parseFileValue(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const hintId = `${labelId}-hint`;
  const errorId = `${labelId}-error`;
  const message = problem ?? error;

  useEffect(() => () => abortRef.current?.abort(), []);

  async function upload(file: File) {
    const bad = fileProblem({ name: file.name, size: file.size, type: mimeFor(file) }, spec);
    if (bad) return setProblem(bad);
    setProblem(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      const res = await uploadFiles("listingAttachment", {
        files: [file],
        headers: getUploadThingAuthHeaders,
        signal: controller.signal,
        onUploadProgress: ({ progress: p }) => setProgress(Math.round(p)),
      });
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (!url) throw new Error("upload returned no url");
      if (current) discardUploads([current.url]);
      // jsonb key order (length, then name), so save confirmation compares equal.
      onChange({ url, mime: mimeFor(file), name: file.name, size: file.size });
    } catch (err) {
      if (controller.signal.aborted) return;
      const reason = classifyUploadError(err);
      setProblem(reason === "too-large" || reason === "wrong-type" ? `Choose a file that is ${describeAccept(spec)}.` : failureMessage(reason, { noun: "file" }));
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  }

  function remove() {
    if (current) discardUploads([current.url]);
    setProblem(null);
    onChange(undefined);
  }

  const describedBy = [hintId, message ? errorId : null].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttribute(spec)}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={Boolean(message)}
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {progress !== null ? (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Uploading… {progress}%</span>
            <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm" onClick={() => abortRef.current?.abort()}>
              Cancel
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
            <div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : current ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2">
          <a href={current.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-foreground underline-offset-2 hover:underline">
            {current.name}
          </a>
          <span className="text-xs text-muted">
            {[fileTypeLabel(current), formatFileSize(current.size)].filter(Boolean).join(" · ")}
          </span>
          <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm min-h-11" onClick={() => inputRef.current?.click()} aria-label={`Replace ${current.name}`}>
            Replace
          </button>
          <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm min-h-11" onClick={remove} aria-label={`Remove ${current.name}`}>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="dm-btn dm-btn-outline dm-btn-sm min-h-11"
          onClick={() => inputRef.current?.click()}
          aria-describedby={describedBy}
        >
          Choose file
        </button>
      )}
      <p id={hintId} className="text-[11px] text-muted">
        {describeAccept(spec)}
      </p>
      {message ? (
        <p id={errorId} className="text-xs text-[color:var(--error)]" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
