"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import { ApiError } from "@/lib/api/base";
import {
  listAdminSwitches,
  updateAdminSwitch,
  type FeatureSwitch,
} from "@/lib/api/platformSettings";
import { EmptyState, ErrorState, LIST, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

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

  return (
    <div>
      <PageHeader
        title="Features"
        description="Switches apply to every seller and save as soon as you flip them."
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading && items.length === 0 ? <PageSkeleton rows={4} label="Loading switches" /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState message="No feature switches yet." /> : null}
      <ul className={items.length ? LIST : ""}>
        {items.map((item) => (
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
