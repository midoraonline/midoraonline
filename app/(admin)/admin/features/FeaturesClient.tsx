"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import { ApiError } from "@/lib/api/base";
import {
  listAdminSwitches,
  MEDIA_LIMITS_KEY,
  parsePlanMediaLimits,
  PLAN_KEYS,
  PLAN_LABEL,
  planMediaLimitsValue,
  updateAdminSwitch,
  updatePlanMediaLimits,
  type FeatureSwitch,
  type MediaLimits,
  type PlanKey,
  type PlanMediaLimits,
} from "@/lib/api/platformSettings";
import { BTN_PRIMARY, CARD, EmptyState, ErrorState, INPUT, LIST, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

type Row = { photos: string; videos: string };
const ROW_KEYS = ["default", ...PLAN_KEYS] as const;
type RowKey = (typeof ROW_KEYS)[number];

function toRows(all: PlanMediaLimits): Record<RowKey, Row> {
  const pick = (l: MediaLimits) => ({ photos: String(l.maxPhotos), videos: String(l.maxVideos) });
  return {
    default: pick(all.default),
    ...(Object.fromEntries(PLAN_KEYS.map((k) => [k, pick(all.plans[k])])) as Record<PlanKey, Row>),
  };
}

function rowValid(r: Row) {
  const p = Number(r.photos);
  const v = Number(r.videos);
  return Number.isInteger(p) && p >= 1 && p <= 20 && Number.isInteger(v) && v >= 0 && v <= 5;
}

function MediaLimitsCard({ initial, onSaved }: { initial: PlanMediaLimits; onSaved: (next: PlanMediaLimits) => void }) {
  const [rows, setRows] = useState<Record<RowKey, Row>>(() => toRows(initial));
  const [saving, setSaving] = useState(false);
  const valid = ROW_KEYS.every((k) => rowValid(rows[k]));
  const dirty = JSON.stringify(rows) !== JSON.stringify(toRows(initial));
  const set = (k: RowKey, field: keyof Row, value: string) => setRows((r) => ({ ...r, [k]: { ...r[k], [field]: value } }));

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    const lim = (r: Row): MediaLimits => ({ maxPhotos: Number(r.photos), maxVideos: Number(r.videos) });
    try {
      const next = await updatePlanMediaLimits({
        default: lim(rows.default),
        plans: Object.fromEntries(PLAN_KEYS.map((k) => [k, lim(rows[k])])) as Record<PlanKey, MediaLimits>,
      });
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
    <section id="media-limits" className={`${CARD} mb-6 scroll-mt-24 p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold text-foreground">Listing media limits by plan</h2>
      <p className="mt-0.5 text-sm text-muted">
        Most photos (1–20) and videos (0–5) per ad, based on the poster&apos;s plan. Ads posted without a plan use Basic.
        Default applies if a plan has no value.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="text-left text-xs text-foreground-muted">
              <th className="py-2 pr-3 font-semibold">Plan</th>
              <th className="py-2 pr-3 font-semibold">Max photos</th>
              <th className="py-2 font-semibold">Max videos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROW_KEYS.map((k) => (
              <tr key={k}>
                <td className="py-2 pr-3 font-medium text-foreground">{k === "default" ? "Default" : PLAN_LABEL[k]}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    aria-label={`${k} max photos`}
                    aria-invalid={!rowValid(rows[k])}
                    value={rows[k].photos}
                    onChange={(e) => set(k, "photos", e.target.value)}
                    className={`${INPUT} max-w-24`}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={5}
                    aria-label={`${k} max videos`}
                    aria-invalid={!rowValid(rows[k])}
                    value={rows[k].videos}
                    onChange={(e) => set(k, "videos", e.target.value)}
                    className={`${INPUT} max-w-24`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    if (err.code === "unknown_setting") return "The API doesn't know this setting yet. Deploy the latest API (PR #16) and try again.";
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
  const limits = parsePlanMediaLimits(limitsRow?.value ?? null);

  return (
    <div>
      <PageHeader
        title="Features"
        description="Listing media limits and platform switches. Switches save as soon as you flip them."
      />
      {!loading || items.length ? (
        <MediaLimitsCard
          key={JSON.stringify(planMediaLimitsValue(limits))}
          initial={limits}
          onSaved={(next) =>
            setItems((prev) =>
              prev.map((row) =>
                row.key === MEDIA_LIMITS_KEY ? { ...row, value: planMediaLimitsValue(next) } : row,
              ),
            )
          }
        />
      ) : null}
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
    </div>
  );
}
