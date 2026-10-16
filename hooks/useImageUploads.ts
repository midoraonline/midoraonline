"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUploadThingAuthHeaders, uploadFiles } from "@/lib/uploadthing";
import { inspectImageMetadata } from "@/lib/imageMetadata";
import { prepareImageForUpload } from "@/lib/imageFitForUpload";
import { discardUploads } from "@/lib/uploads/discard";
import {
  classifyUploadError,
  toastUploadFailure,
  UploadProblem,
  type UploadFailure,
} from "@/lib/uploads/errors";
import { IMAGE_POLICY, type ImageEndpoint } from "@/lib/uploads/policy";

export type UploadItem = {
  id: string;
  /** Instant preview from the picked file (blob: URL). */
  localUrl: string;
  status: "preparing" | "uploading" | "done";
  progress: number;
  url?: string;
};

export type UseImageUploadsOptions = {
  endpoint: ImageEndpoint;
  /** Called once per finished file with its CDN URL. */
  onUploaded: (url: string) => void;
  /** How many images are already attached (counts against the policy max). */
  existingCount?: number;
  /** Overrides the policy maximum (admin-configured listing photo cap). */
  maxFiles?: number;
  /** Optional opt-in processing (logo overlay). */
  transform?: (file: File, setStage: (s: string) => void) => Promise<File>;
};

let seq = 0;
const nextId = () => `up-${Date.now().toString(36)}-${(seq += 1)}`;

/**
 * Shared upload pipeline for listing photos, logos, banners and documents.
 * Every file gets a local preview straight away, its own progress and its
 * own cancel. Failures produce one short toast per reason. No success toast.
 */
export function useImageUploads({
  endpoint,
  onUploaded,
  existingCount = 0,
  maxFiles,
  transform,
}: UseImageUploadsOptions) {
  const basePolicy = IMAGE_POLICY[endpoint];
  const policy = maxFiles && maxFiles > 0 ? { ...basePolicy, maxFiles } : basePolicy;
  const [items, setItems] = useState<UploadItem[]>([]);
  const [stage, setStage] = useState<string | null>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const itemsRef = useRef<UploadItem[]>([]);
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    itemsRef.current = items;
    onUploadedRef.current = onUploaded;
  });
  const lastBatch = useRef<File[]>([]);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...next } : it)));
  }, []);

  const drop = useCallback((id: string) => {
    setItems((list) => {
      const hit = list.find((it) => it.id === id);
      if (hit) URL.revokeObjectURL(hit.localUrl);
      return list.filter((it) => it.id !== id);
    });
    controllers.current.delete(id);
  }, []);

  const uploadOne = useCallback(
    async (file: File, id: string): Promise<UploadFailure | null> => {
      const controller = controllers.current.get(id);
      if (!controller) return null;
      try {
        if (policy.metadataCheck) {
          const verdict = await inspectImageMetadata(file);
          if (!verdict.ok) throw new UploadProblem("stock-photo");
        }
        let prepared = await prepareImageForUpload(file);
        if (transform) {
          prepared = await transform(prepared, setStage);
          setStage(null);
          prepared = await prepareImageForUpload(prepared);
        }
        if (controller.signal.aborted) return null;
        patch(id, { status: "uploading", progress: 0 });
        const res = await uploadFiles(endpoint, {
          files: [prepared],
          headers: getUploadThingAuthHeaders,
          signal: controller.signal,
          onUploadProgress: ({ progress }) => patch(id, { progress: Math.round(progress) }),
        });
        const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
        if (!url) throw new Error("upload returned no url");
        if (controller.signal.aborted) {
          discardUploads([url]);
          return null;
        }
        patch(id, { status: "done", progress: 100, url });
        onUploadedRef.current(url);
        // Keep the local preview until the CDN copy has loaded, then drop it.
        const img = new window.Image();
        img.onload = img.onerror = () => drop(id);
        img.src = url;
        return null;
      } catch (err) {
        setStage(null);
        drop(id);
        if (controller.signal.aborted) return null;
        return classifyUploadError(err);
      }
    },
    [drop, endpoint, patch, policy.metadataCheck, transform],
  );

  const addFiles = useCallback(
    async (picked: File[]) => {
      if (!picked.length) return;
      const pending = itemsRef.current.filter((it) => it.status !== "done").length;
      const room = Math.max(0, policy.maxFiles - existingCount - pending);
      // Single-image kinds replace in place, so one file is always allowed.
      const allowed = policy.maxFiles === 1 ? picked.slice(0, 1) : picked.slice(0, room);
      const failures = new Map<UploadFailure, number>();
      if (picked.length > allowed.length) failures.set("too-many", 1);
      lastBatch.current = allowed;

      const created = allowed.map((file) => {
        const id = nextId();
        controllers.current.set(id, new AbortController());
        return { id, file, localUrl: URL.createObjectURL(file) };
      });
      setItems((list) => [
        ...list,
        ...created.map(({ id, localUrl }) => ({
          id,
          localUrl,
          status: "preparing" as const,
          progress: 0,
        })),
      ]);

      for (const { id, file } of created) {
        const reason = await uploadOne(file, id);
        if (reason) failures.set(reason, (failures.get(reason) ?? 0) + 1);
      }
      for (const [reason, count] of failures) {
        toastUploadFailure(reason, {
          count,
          max: policy.maxFiles,
          noun: policy.noun,
          onRetry: reason === "network" ? () => void addFilesRef.current(lastBatch.current) : undefined,
        });
      }
    },
    [existingCount, policy.maxFiles, policy.noun, uploadOne],
  );
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  }, [addFiles]);

  /** X on a tile: abort an upload in flight, or delete a finished one. */
  const cancel = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      controllers.current.get(id)?.abort();
      if (item?.url) discardUploads([item.url]);
      drop(id);
    },
    [drop],
  );

  useEffect(() => {
    const map = controllers.current;
    return () => {
      for (const c of map.values()) c.abort();
      for (const it of itemsRef.current) URL.revokeObjectURL(it.localUrl);
    };
  }, []);

  const pending = items.filter((it) => it.status !== "done");
  return {
    items: pending,
    addFiles,
    cancel,
    busy: pending.length > 0,
    stage,
    policy,
  };
}
