"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ApiError } from "@/lib/api/base";
import {
  listAdminSwitches,
  updateAdminSwitch,
  type FeatureSwitch,
} from "@/lib/api/platformSettings";

function changedLine(item: FeatureSwitch): string {
  const when = item.updated_at ? new Date(item.updated_at) : null;
  const stamp =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : null;
  if (item.updated_by && stamp) return `Changed by ${item.updated_by} · ${stamp}`;
  if (stamp) return `Changed ${stamp}`;
  if (item.updated_by) return `Changed by ${item.updated_by}`;
  return "No changes yet";
}

export default function FeaturesClient() {
  const [items, setItems] = useState<FeatureSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<FeatureSwitch | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listAdminSwitches());
    } catch (err) {
      setItems([]);
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

  async function confirmToggle() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const next = await updateAdminSwitch(pending.key, !pending.enabled);
      setItems((prev) => prev.map((item) => (item.key === next.key ? { ...item, ...next } : item)));
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that switch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-xl text-sm text-muted">
        Platform switches apply to every seller. Turning one off hides that feature until you turn it back on.
      </p>
      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading switches…</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-muted">No feature switches yet.</p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="dm-card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              {item.description ? <p className="mt-1 text-xs text-muted">{item.description}</p> : null}
              <p className="mt-1 text-[11px] text-muted">{changedLine(item)}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={item.enabled}
              disabled={busy}
              onClick={() => setPending(item)}
              className="dm-focus grid min-h-11 min-w-11 place-items-center"
            >
              <span
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  item.enabled ? "bg-accent" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                    item.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </span>
              <span className="sr-only">{item.enabled ? `Turn off ${item.label}` : `Turn on ${item.label}`}</span>
            </button>
          </li>
        ))}
      </ul>
      {pending ? (
        <ConfirmDialog
          title={pending.enabled ? `Turn off ${pending.label}?` : `Turn on ${pending.label}?`}
          message={
            pending.description
              ? pending.description
              : pending.enabled
                ? "Sellers will lose this feature until you turn it back on."
                : "Sellers will see this feature again."
          }
          confirmLabel={pending.enabled ? "Turn off" : "Turn on"}
          destructive={pending.enabled}
          busy={busy}
          onConfirm={() => void confirmToggle()}
          onClose={() => {
            if (!busy) setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}
