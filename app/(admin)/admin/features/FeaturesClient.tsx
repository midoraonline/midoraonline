"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import { ApiError } from "@/lib/api/base";
import {
  DEFAULT_MEDIA_LIMITS,
  listAdminSwitches,
  MEDIA_LIMITS_KEY,
  parseMediaLimits,
  updateAdminSwitch,
  updateMediaLimits,
  type FeatureSwitch,
  type MediaLimits,
} from "@/lib/api/platformSettings";
import { BTN_PRIMARY, CARD, EmptyState, ErrorState, INPUT, LIST, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

function MediaLimitsCard({ initial, onSaved }: { initial: MediaLimits; onSaved: (next: MediaLimits) => void }) {
  const [photos, setPhotos] = useState(String(initial.maxPhotos));
  const [videos, setVideos] = useState(String(initial.maxVideos));
  const [saving, setSaving] = useState(false);
  const p = Number(photos);
  const v = Number(videos);
  const valid = Number.isInteger(p) && p >= 1 && p <= 20 && Number.isInteger(v) && v >= 0 && v <= 5;
  const dirty = p !== initial.maxPhotos || v !== initial.maxVideos;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const next = await updateMediaLimits({ maxPhotos: p, maxVideos: v });
      onSaved(next);
      void mutate("settings-public");
      toast.success("Media limits saved");
    } catch (err) {
      toast.error(failureMessage("media limits", err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${CARD} mt-6 p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold text-foreground">Listing media limits</h2>
      <p className="mt-0.5 text-sm text-muted">
        Most photos and videos a seller can add to one ad. Applies to new uploads and saves.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Max photos (1–20)</span>
          <input type="number" inputMode="numeric" min={1} max={20} value={photos} onChange={(e) => setPhotos(e.target.value)} className={INPUT} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Max videos (0–5)</span>
          <input type="number" inputMode="numeric" min={0} max={5} value={videos} onChange={(e) => setVideos(e.target.value)} className={INPUT} />
        </label>
      </div>
      {!valid ? <p className="mt-2 text-xs text-[color:var(--error)]">Photos must be 1–20 and videos 0–5.</p> : null}
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => void save()} disabled={!valid || !dirty || saving} className={BTN_PRIMARY}>
          {saving ? "Saving…" : "Save limits"}
        </button>
      </div>
    </section>
  );
}

function changedLine(item: FeatureSwitch): string {
  const when = item.updated_at ? new Date(item.updated_at) : null;
  const stamp =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : null;
  if (stamp) return `Last changed ${stamp}`;
  return "Not changed yet";
}

function failureMessage(label: string, err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return "Your admin session expired. Sign in again and retry.";
    if (err.code === "migration_required") return "Settings storage isn't set up on the server yet.";
  }
  return `Couldn't update ${label}. It's back to how it was. Try again.`;
}

export default function FeaturesClient() {
  const [items, setItems] = useState<FeatureSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const inflight = useRef<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listAdminSwitches());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        setError("Feature switches are not available yet.");
      } else {
        setError(err instanceof Error ? err.message : "Could not load feature switches.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(item: FeatureSwitch, next: boolean) {
    if (inflight.current[item.key]) return;
    inflight.current[item.key] = true;
    setSaving((prev) => ({ ...prev, [item.key]: true }));
    setItems((prev) => prev.map((row) => (row.key === item.key ? { ...row, enabled: next } : row)));
    try {
      const saved = await updateAdminSwitch(item.key, next);
      setItems((prev) =>
        prev.map((row) => (row.key === item.key ? { ...row, ...saved, label: row.label, description: row.description } : row)),
      );
      void mutate("settings-public");
    } catch (err) {
      setItems((prev) => prev.map((row) => (row.key === item.key ? { ...row, enabled: item.enabled } : row)));
      toast.error(failureMessage(item.label, err));
    } finally {
      inflight.current[item.key] = false;
      setSaving((prev) => ({ ...prev, [item.key]: false }));
    }
  }

  const switches = items.filter((item) => item.key !== MEDIA_LIMITS_KEY);
  const limitsRow = items.find((item) => item.key === MEDIA_LIMITS_KEY);
  const limits = limitsRow?.value ? parseMediaLimits(limitsRow.value) : DEFAULT_MEDIA_LIMITS;

  return (
    <div>
      <PageHeader
        title="Features"
        description="Switches apply to every seller and save as soon as you flip them."
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading && items.length === 0 ? <PageSkeleton rows={4} label="Loading switches" /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState message="No feature switches yet." /> : null}
      <ul className={switches.length ? LIST : ""}>
        {switches.map((item) => (
          <li key={item.key} className="px-4 py-2">
            <SettingsSwitch
              label={item.label}
              hint={[item.description, changedLine(item)].filter(Boolean).join(" · ")}
              checked={item.enabled}
              disabled={Boolean(saving[item.key])}
              onChange={(next) => void toggle(item, next)}
            />
          </li>
        ))}
      </ul>
      {!loading && !error ? (
        <MediaLimitsCard
          key={`${limits.maxPhotos}-${limits.maxVideos}`}
          initial={limits}
          onSaved={(next) =>
            setItems((prev) =>
              prev.map((row) =>
                row.key === MEDIA_LIMITS_KEY ? { ...row, value: { max_photos: next.maxPhotos, max_videos: next.maxVideos } } : row,
              ),
            )
          }
        />
      ) : null}
    </div>
  );
}
