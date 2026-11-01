"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { FeedConfigResponse, FeedConfigTestResponse } from "@/lib/api/admin";
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TEXT, ErrorState, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

const GROUPS: Array<{ title: string; description: string; keys: string[] }> = [
  {
    title: "Score weights",
    description: "Share of the 0–100 score from each signal. Engagement only counts from stage 5.",
    keys: [
      "QUALITY_WEIGHT",
      "FRESHNESS_WEIGHT",
      "TRUST_WEIGHT",
      "ENGAGEMENT_WEIGHT",
      "EXPOSURE_WEIGHT",
      "FRESHNESS_HALF_LIFE_HOURS",
      "FRAUD_MEDIUM_PENALTY",
      "FOLLOWED_SHOP_BOOST",
    ],
  },
  {
    title: "Quality gates",
    description: "Minimum listing quality for the feed, exploration and paid spots.",
    keys: ["QUALITY_MIN", "EXPLORATION_MIN_QUALITY", "EXPLORATION_MAX_IMPRESSIONS", "PAID_MIN_QUALITY"],
  },
  {
    title: "Growth stages",
    description: "Eligible listing counts that switch on stricter rules.",
    keys: [
      "STAGE_1_MIN",
      "STAGE_2_MIN",
      "STAGE_3_MIN",
      "STAGE_4_MIN",
      "STAGE_5_MIN",
      "STAGE_6_MIN",
      "PAID_MIN_STAGE",
      "TYPE_MIX_MIN_STAGE",
      "ENGAGEMENT_MIN_STAGE",
      "EXPLORATION_STAGE_3",
      "EXPLORATION_STAGE_4",
    ],
  },
  {
    title: "Blocks and mix",
    description: "Block size, seller cap, paid position and Home type shares.",
    keys: [
      "BLOCK_SIZE",
      "SELLER_CAP_PER_BLOCK",
      "PAID_SLOT_POSITION",
      "TYPE_DEPTH_BLOCKS",
      "PRODUCT_SHARE",
      "SERVICE_SHARE",
      "OPPORTUNITY_SHARE",
    ],
  },
  {
    title: "Exposure and repeats",
    description: "Rotate over-shown sellers and hide listings a viewer has seen often.",
    keys: [
      "EXPOSURE_TARGET_IMPRESSIONS",
      "EXPOSURE_MIN_MULTIPLIER",
      "EXPOSURE_WINDOW_HOURS",
      "FATIGUE_THRESHOLD",
      "FATIGUE_WINDOW_HOURS",
    ],
  },
  {
    title: "Badges and refresh",
    description: "Badge windows and how long the shared order is reused.",
    keys: ["NEW_BADGE_HOURS", "CLOSING_SOON_HOURS", "SNAPSHOT_TTL_SECONDS"],
  },
];

function fmt(n: number) {
  if (Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export default function FeedConfigClient() {
  const [config, setConfig] = useState<FeedConfigResponse | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<FeedConfigTestResponse | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiAdmin.getFeedConfig();
      setConfig(res);
      const initial: Record<string, string> = {};
      for (const key of res.overridable_keys) {
        const eff = res.overrides[key] ?? res.defaults[key];
        initial[key] = String(eff ?? "");
      }
      setValues(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed config");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changedKeys = useMemo(() => {
    if (!config) return [] as string[];
    const changed: string[] = [];
    for (const key of config.overridable_keys) {
      const def = String(config.defaults[key] ?? "");
      if ((values[key] ?? "") !== def) changed.push(key);
    }
    return changed;
  }, [config, values]);

  const buildOverrides = useCallback((): Record<string, number> => {
    if (!config) return {};
    const out: Record<string, number> = {};
    for (const key of config.overridable_keys) {
      const raw = values[key];
      if (raw === undefined || raw === "") continue;
      const asNumber = Number(raw);
      if (Number.isNaN(asNumber)) continue;
      const def = Number(config.defaults[key]);
      if (Number.isFinite(def) && asNumber === def) continue;
      out[key] = asNumber;
    }
    return out;
  }, [config, values]);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const overrides = buildOverrides();
      const res = await apiAdmin.putFeedConfig(overrides);
      setStatus(`Saved. ${Object.keys(res.applied).length} override(s) active.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [buildOverrides, load]);

  const reset = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await apiAdmin.resetFeedConfig();
      setStatus("Reset to code defaults.");
      await load();
      setTest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setSaving(false);
    }
  }, [load]);

  const runTest = useCallback(async () => {
    setTesting(true);
    setError(null);
    try {
      const overrides = buildOverrides();
      const res = await apiAdmin.testFeedConfig(overrides, 25);
      setTest(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setTesting(false);
    }
  }, [buildOverrides]);

  if (!config) {
    return (
      error ? <ErrorState message={error} /> : <PageSkeleton rows={6} label="Loading feed configuration" />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Feed tuning"
        description="Weights, quality gates, growth stages and block rules for the shared feed. Changes rebuild the feed order."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={reset} disabled={saving} className={BTN_TEXT}>
              Reset to defaults
            </button>
            <button onClick={runTest} disabled={testing} className={BTN_SECONDARY}>
              {testing ? "Testing…" : "Dry run"}
            </button>
            <button onClick={save} disabled={saving || changedKeys.length === 0} className={BTN_PRIMARY}>
              {saving ? "Saving…" : changedKeys.length ? `Save ${changedKeys.length} changes` : "Save changes"}
            </button>
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}
      {status ? (
        <p className="rounded-lg border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{status}</p>
      ) : null}

      {/* Applied overrides summary */}
      <section className="rounded-xl border border-border bg-surface shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Currently applied</h2>
            <p className="mt-0.5 text-xs text-muted">
              {Object.keys(config.applied).length === 0
                ? "No overrides — using code defaults."
                : `${Object.keys(config.applied).length} override(s) active.`}
              {config.updated_at ? ` Updated ${new Date(config.updated_at).toLocaleString()}.` : ""}
            </p>
          </div>
        </div>
        {Object.keys(config.applied).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(config.applied).map(([k, v]) => (
              <span
                key={k}
                className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-mono"
              >
                {k}={String(v)}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Editable groups */}
      <div className="space-y-6">
        {GROUPS.map((group) => {
          const keys = group.keys.filter((k) => config.overridable_keys.includes(k));
          if (keys.length === 0) return null;
          return (
            <section key={group.title} className="rounded-xl border border-border bg-surface shadow-xs p-5">
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <p className="mt-0.5 text-xs text-muted">{group.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {keys.map((key) => {
                  const def = config.defaults[key];
                  const cur = values[key] ?? "";
                  const isChanged = String(def ?? "") !== cur;
                  return (
                    <label key={key} className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-foreground/80">
                          {key}
                        </span>
                        {isChanged ? (
                          <span className="text-xs text-[color:var(--warning)]">
                            changed
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={cur}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className={`mt-1.5 w-full rounded-lg border px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                          isChanged
                            ? "border-amber-500/40 bg-amber-500/[0.04]"
                            : "border-border bg-white"
                        }`}
                      />
                      <p className="mt-1 text-[10px] text-muted">
                        default {String(def)}
                      </p>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Tester */}
      {test ? (
        <section className="rounded-xl border border-border bg-surface shadow-xs p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Dry-run results</h2>
              <p className="mt-0.5 text-xs text-muted">
                Scored {test.summary.sample_size} of the newest live listings
                against the proposed values.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="text-muted">
                avg new: <span className="tabular-nums">{fmt(test.summary.avg_score)}</span>
              </div>
              <div className="text-muted">
                avg baseline: <span className="tabular-nums">{fmt(test.summary.avg_baseline)}</span>
              </div>
              <div className="text-muted">
                Δ range: <span className="tabular-nums">{fmt(test.summary.min_delta)} → {fmt(test.summary.max_delta)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-surface-subtle text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-3 py-2">Listing</th>
                  <th className="px-3 py-2 text-right">New</th>
                  <th className="px-3 py-2 text-right">Baseline</th>
                  <th className="px-3 py-2 text-right">Δ</th>
                  <th className="px-3 py-2">Top components</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {test.results.slice(0, 20).map((row) => {
                  const topComps = Object.entries(row.components)
                    .filter(([, v]) => v !== 0)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .slice(0, 3);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="px-3 py-2.5">
                        <p className="truncate font-medium">{row.title || row.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        {fmt(row.total)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                        {fmt(row.baseline_total)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular-nums font-semibold ${
                          row.delta > 0
                            ? "text-emerald-600"
                            : row.delta < 0
                              ? "text-rose-600"
                              : "text-muted"
                        }`}
                      >
                        {row.delta > 0 ? "+" : ""}
                        {fmt(row.delta)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {topComps.map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-xs font-mono"
                            >
                              {k}: {fmt(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
