"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import {
  deleteUploadThingFiles,
  getUploadThingAuthHeaders,
  useUploadThing,
} from "@/lib/uploadthing";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = { className?: string };

export default function ProfileAvatarUpload({ className = "" }: Props) {
  const session = useAppSession();
  const user = session.user;
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarUrl = user?.avatar_url ?? null;
  const initials = (user?.full_name || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    headers: getUploadThingAuthHeaders,
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (!url) {
        setError("Upload finished but no URL was returned.");
        return;
      }
      void persistAvatar(url, avatarUrl);
    },
    onUploadError: (e) => {
      setError(e.message || "Upload failed");
      toast.error("Upload failed", { description: e.message });
    },
  });

  async function persistAvatar(url: string | null, previousUrl?: string | null) {
    setSaving(true);
    setError(null);
    try {
      await apiAuth.updateProfile({ avatar_url: url ?? "" });
      notifyAuthChanged();
      if (previousUrl && previousUrl !== url) {
        void deleteUploadThingFiles([previousUrl]);
      }
      toast.success(url ? "Profile photo updated" : "Profile photo removed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile photo.";
      setError(msg);
      toast.error("Could not save photo", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  const busy = isUploading || saving;

  return (
    <div id="profile-photo" className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-subtle">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile photo"
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid size-full place-items-center bg-accent/15 text-lg font-bold text-accent">
              {initials || "?"}
            </div>
          )}
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
              accept="image/*"
              className="hidden"
              aria-hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setError(null);
                void startUpload([file]);
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
                onClick={() => void persistAvatar(null, avatarUrl)}
                className="dm-btn dm-btn-ghost dm-btn-sm inline-flex min-h-11 items-center gap-1.5 text-muted"
              >
                <MaterialSymbol name="delete" className="!text-base" />
                Remove
              </button>
            ) : null}
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
