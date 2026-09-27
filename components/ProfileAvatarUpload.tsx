"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { avatarFileForUpload } from "@/lib/imageFitForUpload";
import { useAppSession } from "@/lib/state";
import { useSessionStore } from "@/lib/state/session-store";
import { getUploadThingAuthHeaders, useUploadThing } from "@/lib/uploadthing";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import UserAvatar from "@/components/UserAvatar";

type Props = { className?: string };

const PROXY_AVATAR_MAX = 4 * 1024 * 1024;
const AVATAR_MAX = 16 * 1024 * 1024;

function avatarErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413 || err.code === "avatar_too_large") {
      return "This photo is too large to upload here. Choose a file under 16MB.";
    }
    if (err.status === 415) return "Use a JPEG, PNG, WebP, GIF, or HEIC photo.";
    if (err.status === 401) return "Sign in again to update your profile photo.";
    if (err.status >= 500 || /internal server error/i.test(err.message)) {
      return "We couldn't save that photo. Please try again.";
    }
    if (err.message.trim() && !/^Request failed/i.test(err.message) && !/^HTTP \d+/.test(err.message)) {
      return err.message;
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return "We couldn't save that photo. Please try again.";
}

function canRetryViaUploadThing(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return err.status === 404 || err.status === 405 || err.status === 413 || err.status === 502 || err.status === 503;
}

export default function ProfileAvatarUpload({ className = "" }: Props) {
  const session = useAppSession();
  const user = session.user;
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const avatarUrl = preview || user?.avatar_url || null;

  function clearPreview() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const { startUpload, isUploading } = useUploadThing("avatarImage", {
    headers: getUploadThingAuthHeaders,
    onUploadProgress: (pct) => setProgress(Math.round(pct)),
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (!url) {
        setError("Upload finished but no photo URL was returned.");
        clearPreview();
        return;
      }
      void persistAvatar(url);
    },
    onUploadError: (e) => {
      const msg = e.message || "We couldn't save that photo. Please try again.";
      setError(msg);
      toast.error("Could not save photo", { description: msg });
      clearPreview();
    },
  });

  async function persistAvatar(url: string | null) {
    setSaving(true);
    setError(null);
    try {
      const me = await apiAuth.updateProfile({ avatar_url: url ?? "" });
      if (!url) clearPreview();
      useSessionStore.getState().setSession({ user: me });
      notifyAuthChanged();
      toast.success(url ? "Profile photo updated" : "Profile photo removed");
      setProgress(100);
    } catch (err) {
      const msg = avatarErrorMessage(err);
      setError(msg);
      toast.error("Could not save photo", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function uploadViaUploadThing(file: File) {
    setProgress(0);
    await startUpload([file]);
  }

  async function uploadFile(file: File) {
    setSaving(true);
    setProgress(0);
    setError(null);
    const local = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return local;
    });
    try {
      const prepared = await avatarFileForUpload(file);
      if (prepared.size > AVATAR_MAX) {
        throw new Error("This photo is larger than 16MB. Choose a smaller file.");
      }
      if (prepared.size <= PROXY_AVATAR_MAX) {
        try {
          const me = await apiAuth.uploadAvatar(prepared, setProgress);
          useSessionStore.getState().setSession({ user: me });
          notifyAuthChanged();
          toast.success("Profile photo updated");
          setProgress(100);
          return;
        } catch (err) {
          if (!canRetryViaUploadThing(err)) throw err;
        }
      }
      await uploadViaUploadThing(prepared);
    } catch (err) {
      const msg = avatarErrorMessage(err);
      setError(msg);
      toast.error("Could not save photo", { description: msg });
      clearPreview();
    } finally {
      setSaving(false);
    }
  }

  const busy = isUploading || saving;
  const progressLabel =
    progress != null && busy ? `Uploading ${progress}%` : busy ? "Uploading…" : null;

  return (
    <div id="profile-photo" className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative size-20 shrink-0">
          <UserAvatar
            url={avatarUrl}
            name={user?.full_name || user?.email}
            size={80}
            alt="Profile photo"
            className="border border-border bg-surface-subtle"
          />
          {busy ? (
            <div className="absolute inset-0 grid place-items-center bg-background/60">
              <Loader2 className="size-5 animate-spin text-accent" aria-hidden />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-xs text-muted">
            Shown on your messages and listings. Square images work best.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              aria-hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void uploadFile(file);
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="dm-btn dm-btn-secondary dm-btn-sm inline-flex min-h-11 items-center gap-1.5"
            >
              <MaterialSymbol name="photo_camera" className="!text-base" />
              {avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void persistAvatar(null)}
                className="dm-btn dm-btn-ghost dm-btn-sm inline-flex min-h-11 items-center gap-1.5 text-muted"
              >
                <MaterialSymbol name="delete" className="!text-base" />
                Remove
              </button>
            ) : null}
          </div>
          {progressLabel ? (
            <p className="text-xs text-muted" aria-live="polite">
              {progressLabel}
            </p>
          ) : null}
          {busy && progress != null ? (
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          {error ? <p className="text-xs text-[color:var(--error)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
