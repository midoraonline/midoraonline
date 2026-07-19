"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { FeedConfigResponse, FeedConfigTestResponse } from "@/lib/api/admin";

// Group overridable keys into logical sections for the UI.
const GROUPS: Array<{ title: string; description: string; keys: string[] }> = [
  {
    title: "Score bonuses",
    description: "Additive points contributed by each ranking signal.",
    keys: [
      "VECTOR_SCORE_SCALE",
      "CATEGORY_MATCH_BOOST",
      "SEARCH_MATCH_PER_MATCH",
      "SEARCH_MATCH_MAX_HITS",
      "FOLLOWED_SHOP_BOOST",
      "NEW_SELLER_BONUS",
      "EXPLORATION_BONUS",
      "SELLER_QUALITY_CAP",
      "GLOBAL_POPULARITY_CAP",
      "PREMIUM_STORE_BONUS",
      "SPONSORED_LISTING_BONUS",
      "LISTING_BOOST_BONUS",
      "SUPER_BOOST_BONUS",
    ],
  },
  {
    title: "Freshness & velocity",
    description: "How much recency and short-window engagement matter.",
    keys: [
      "FRESHNESS_FALLBACK",
      "FRESHNESS_MAX_AGE_DAYS",
      "VELOCITY_WINDOW_HOURS",
      "VELOCITY_MAX_BONUS",
      "VELOCITY_HALF_LIFE",
    ],
  },
  {
    title: "New seller cold-start",
    description: "Protection window for new sellers before regular ranking.",
    keys: [
      "NEW_SELLER_MAX_AGE_DAYS",
      "NEW_SELLER_MAX_IMPRESSIONS",
      "NEW_SELLER_GUARANTEED_IMPRESSIONS",
    ],
  },
  {
    title: "Penalties & diversity",
    description: "Demotions, vendor rotation, and per-window seller caps.",
    keys: [
      "SEEN_DEMOTION",
      "VENDOR_DIVERSITY_K",
      "VENDOR_DIVERSITY_CAP",
      "VENDOR_WINDOW_SIZE",
      "VENDOR_WINDOW_MAX_PER_SELLER",
    ],
  },
  {
    title: "Exposure multiplier",
    description: "Rotates over-exposed sellers off the top of the feed.",
    keys: [
      "EXPOSURE_TARGET_IMPRESSIONS",
      "EXPOSURE_EXPONENT",
      "EXPOSURE_MIN_MULTIPLIER",
      "EXPOSURE_WINDOW_HOURS",
    ],
  },
  {
    title: "Impression fatigue & pagination",
    description: "How aggressively repeated listings are hidden.",
    keys: [
      "FATIGUE_THRESHOLD",
      "FATIGUE_WINDOW_HOURS",
      "DEDUP_WINDOW_HOURS",
      "DEDUP_MAX_LOOKBACK",
      "CANDIDATE_POOL_MAX",
      "DECAY_LAMBDA_PER_DAY",
    ],
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
      <div className="dm-card p-8 text-sm text-muted">
        {error ?? "Loading feed configuration…"}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Feed scoring & placement
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Tune every score bonus, penalty, freshness curve, and vendor-diversity
            constraint used by the ranking engine. Changes take effect within a
            minute and can be dry-run first with the tester below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={reset}
            disabled={saving}
            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.04] disabled:opacity-60"
          >
            Reset to defaults
          </button>
          <button
            onClick={runTest}
            disabled={testing}
            className="rounded-xl border border-border bg-foreground/[0.04] px-3 py-2 text-xs font-semibold hover:bg-foreground/[0.08] disabled:opacity-60"
          >
            {testing ? "Testing…" : "Dry-run test"}
          </button>
          <button
            onClick={save}
            disabled={saving || changedKeys.length === 0}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${changedKeys.length ? `(${changedKeys.length})` : ""}`}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {status}
        </div>
      ) : null}

      {/* Applied overrides summary */}
      <section className="dm-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold">Currently applied</h2>
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
                className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-mono"
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
            <section key={group.title} className="dm-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">{group.title}</h2>
              <p className="mt-0.5 text-xs text-muted">{group.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {keys.map((key) => {
                  const def = config.defaults[key];
                  const cur = values[key] ?? "";
                  const isChanged = String(def ?? "") !== cur;
                  return (
                    <label key={key} className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold uppercase text-foreground/80">
                          {key}
                        </span>
                        {isChanged ? (
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
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
        <section className="dm-card p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold">Dry-run results</h2>
              <p className="mt-0.5 text-xs text-muted">
                Scored {test.summary.sample_size} of the most-viewed live listings
                against the proposed values.
              </p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <div className="rounded-lg bg-surface-subtle px-3 py-1.5 font-semibold">
                avg new: <span className="tabular-nums">{fmt(test.summary.avg_score)}</span>
              </div>
              <div className="rounded-lg bg-surface-subtle px-3 py-1.5 font-semibold">
                avg baseline: <span className="tabular-nums">{fmt(test.summary.avg_baseline)}</span>
              </div>
              <div className="rounded-lg bg-surface-subtle px-3 py-1.5 font-semibold">
                Δ range: <span className="tabular-nums">{fmt(test.summary.min_delta)} → {fmt(test.summary.max_delta)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-sm">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Listing</th>
                  <th className="px-3 py-2 text-right">New</th>
                  <th className="px-3 py-2 text-right">Baseline</th>
                  <th className="px-3 py-2 text-right">Δ</th>
                  <th className="px-3 py-2">Top components</th>
                </tr>
              </thead>
              <tbody>
                {test.results.slice(0, 20).map((row) => {
                  const topComps = Object.entries(row.components)
                    .filter(([, v]) => v !== 0)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .slice(0, 3);
                  return (
                    <tr key={row.id} className="rounded-xl bg-foreground/[0.03]">
                      <td className="rounded-l-xl px-3 py-3">
                        <p className="truncate font-semibold">{row.title || row.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">
                        {fmt(row.total)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted">
                        {fmt(row.baseline_total)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right tabular-nums font-semibold ${
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
                      <td className="rounded-r-xl px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {topComps.map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-mono"
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
