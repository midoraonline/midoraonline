"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiAdmin } from "@/lib/api";
import type { FeedConfigResponse, FeedConfigTestResponse } from "@/lib/api/admin";
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TEXT, ErrorState, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

const GROUPS: Array<{ title: string; description: string; keys: string[] }> = [
  {
    title: "Score weights by stage",
    description:
      "Quality / freshness / fair-exposure weights for 1–49, 50–99 and 100+ qualified listings. Trust and engagement stay off in the MVP.",
    keys: [
      "EARLY_QUALITY_WEIGHT",
      "EARLY_FRESHNESS_WEIGHT",
      "EARLY_EXPOSURE_WEIGHT",
      "MID_QUALITY_WEIGHT",
      "MID_FRESHNESS_WEIGHT",
      "MID_EXPOSURE_WEIGHT",
      "LATE_QUALITY_WEIGHT",
      "LATE_FRESHNESS_WEIGHT",
      "LATE_EXPOSURE_WEIGHT",
      "MVP_MID_MIN",
      "MVP_LATE_MIN",
      "TRUST_WEIGHT",
      "ENGAGEMENT_WEIGHT",
      "FRAUD_MEDIUM_PENALTY",
      "FOLLOWED_SHOP_LIFT",
      "FOLLOWED_SHOP_BOOST",
    ],
  },
  {
    title: "Freshness",
    description: "Services and opportunities age more slowly. Meaningful edits refresh freshness at most once per cooldown.",
    keys: ["SERVICE_FRESHNESS_STRETCH", "OPPORTUNITY_FRESHNESS_STRETCH", "FRESHNESS_RESET_COOLDOWN_HOURS"],
  },
  {
    title: "Location",
    description: "How much the buyer's browsing area counts: 50–99 listings, then per type from 100.",
    keys: ["LOCATION_WEIGHT_MID", "LOCATION_WEIGHT_PRODUCT", "LOCATION_WEIGHT_SERVICE", "LOCATION_WEIGHT_OPPORTUNITY"],
  },
  {
    title: "Quality gates",
    description: "Minimum listing quality for the feed, the first block, exploration and paid spots.",
    keys: ["QUALITY_MIN", "FIRST_BLOCK_QUALITY_FLOOR", "EXPLORATION_MIN_QUALITY", "EXPLORATION_MAX_IMPRESSIONS", "PAID_MIN_QUALITY"],
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
    description: "Block size, seller cap, paid positions and Home type shares.",
    keys: [
      "BLOCK_SIZE",
      "SELLER_CAP_PER_BLOCK",
      "MAX_SAME_TYPE_RUN",
      "MAX_SAME_SUBCATEGORY_RUN",
      "PAID_SLOT_POSITION",
      "SPONSORED_SLOT_POSITION",
      "TYPE_DEPTH_BLOCKS",
    ],
  },
  {
    title: "Exposure",
    description: "Listings seen less in this window get a fair-exposure lift. Seller-own views never count.",
    keys: ["EXPOSURE_WINDOW_HOURS"],
  },
  {
    title: "Sessions",
    description: "How long a buyer's Home order stays stable, and how long recently shown cards wait before repeating.",
    keys: ["FEED_SESSION_HOURS", "RECENTLY_SHOWN_HOURS"],
  },
  {
    title: "Badges and refresh",
    description: "Badge windows, Trending thresholds and how long the shared order is reused.",
    keys: [
      "NEW_BADGE_HOURS",
      "CLOSING_SOON_HOURS",
      "TRENDING_MIN_STAGE",
      "TRENDING_WINDOW_HOURS",
      "TRENDING_MIN_UNIQUE_VIEWERS",
      "TRENDING_MIN_ACTIONS",
      "TRENDING_TOP_SHARE",
      "SNAPSHOT_TTL_SECONDS",
    ],
  },
];

const TOGGLE_LABELS: Record<string, string> = {
  FOLLOWED_SHOP_LIFT: "Lift followed shops for signed-in viewers",
};

const MIX_LANES = [
  { key: "PRODUCT_SHARE", label: "Products" },
  { key: "SERVICE_SHARE", label: "Services" },
  { key: "OPPORTUNITY_SHARE", label: "Opportunities" },
] as const;

type MixKey = (typeof MIX_LANES)[number]["key"];
type MixCounts = Record<MixKey, string>;

/** Mirrors the API's `laneTargets`: normalized shares, largest remainder, summing to the block size. */
function sharesToCounts(shares: Record<MixKey, number>, blockSize: number): Record<MixKey, number> {
  const block = Math.max(Math.trunc(blockSize) || 0, 0);
  const raw = MIX_LANES.map(({ key }) => ({ key, share: Math.max(Number(shares[key]) || 0, 0) }));
  const sum = raw.reduce((a, r) => a + r.share, 0);
  const out = { PRODUCT_SHARE: 0, SERVICE_SHARE: 0, OPPORTUNITY_SHARE: 0 } as Record<MixKey, number>;
  if (sum <= 0) return { ...out, PRODUCT_SHARE: block };
  const exact = raw.map((r, i) => ({ key: r.key, i, value: (r.share / sum) * block }));
  for (const e of exact) out[e.key] = Math.floor(e.value);
  let left = block - exact.reduce((a, e) => a + out[e.key], 0);
  for (const e of [...exact].sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)) || a.i - b.i)) {
    if (left <= 0) break;
    out[e.key] += 1;
    left -= 1;
  }
  return out;
}

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
  const [mix, setMix] = useState<MixCounts>({ PRODUCT_SHARE: "", SERVICE_SHARE: "", OPPORTUNITY_SHARE: "" });

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
      const shares = Object.fromEntries(MIX_LANES.map(({ key }) => [key, Number(initial[key])])) as Record<MixKey, number>;
      const counts = sharesToCounts(shares, Number(initial.BLOCK_SIZE));
      setMix(Object.fromEntries(MIX_LANES.map(({ key }) => [key, String(counts[key])])) as MixCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed config");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blockSize = Math.trunc(Number(values.BLOCK_SIZE)) || 0;
  const mixNumbers = MIX_LANES.map(({ key }) => (mix[key].trim() === "" ? NaN : Number(mix[key])));
  const mixTotal = mixNumbers.reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0);
  const mixError = mixNumbers.some((n) => !Number.isInteger(n) || n < 0)
    ? "Use whole numbers of 0 or more for each type."
    : blockSize <= 0
      ? "Set a block size above 0."
      : mixTotal !== blockSize
        ? `Counts add up to ${mixTotal}; they must add up to the block size (${blockSize}).`
        : null;

  // Type shares are edited as cards-per-block and saved as count / BLOCK_SIZE.
  const effective = useMemo(() => {
    if (mixError) return values;
    const out = { ...values };
    for (const { key } of MIX_LANES) {
      const share = Number(mix[key]) / blockSize;
      const def = Number(config?.defaults[key]);
      out[key] = Math.abs(share - def) < 1e-9 ? String(config?.defaults[key] ?? share) : String(share);
    }
    return out;
  }, [values, mix, mixError, blockSize, config]);

  const changedKeys = useMemo(() => {
    if (!config) return [] as string[];
    const changed: string[] = [];
    for (const key of config.overridable_keys) {
      const def = String(config.defaults[key] ?? "");
      if ((effective[key] ?? "") !== def) changed.push(key);
    }
    return changed;
  }, [config, effective]);

  const buildOverrides = useCallback((): Record<string, number> => {
    if (!config) return {};
    const out: Record<string, number> = {};
    for (const key of config.overridable_keys) {
      const raw = effective[key];
      if (raw === undefined || raw === "") continue;
      const asNumber = Number(raw);
      if (Number.isNaN(asNumber)) continue;
      const def = Number(config.defaults[key]);
      if (Number.isFinite(def) && asNumber === def) continue;
      out[key] = asNumber;
    }
    return out;
  }, [config, effective]);

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
            <button onClick={runTest} disabled={testing || Boolean(mixError)} className={BTN_SECONDARY}>
              {testing ? "Testing…" : "Dry run"}
            </button>
            <button onClick={save} disabled={saving || changedKeys.length === 0 || Boolean(mixError)} className={BTN_PRIMARY}>
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

      {/* Home type mix */}
      <section className="rounded-xl border border-border bg-surface shadow-xs p-5">
        <h2 className="text-sm font-semibold">Home type mix</h2>
        <p className="mt-0.5 text-xs text-muted">
          How many cards of each type to aim for in every block of {blockSize || "—"} on Home. When a type runs out,
          the others fill its slots. Saving rebuilds the feed; buyers get the new mix the next time Home loads.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {MIX_LANES.map(({ key, label }) => {
            const defCount = config ? sharesToCounts(config.defaults as Record<MixKey, number>, blockSize)[key] : 0;
            const isChanged = mix[key] !== String(defCount);
            return (
              <label key={key} className="block">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">{label} per block</span>
                  {isChanged ? <span className="text-xs text-[color:var(--warning)]">changed</span> : null}
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  max={blockSize || undefined}
                  value={mix[key]}
                  onChange={(e) => setMix((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={`mt-1.5 w-full rounded-lg border px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                    isChanged ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-border bg-white"
                  }`}
                />
                <p className="mt-1 text-[10px] text-muted">
                  default {defCount} · {blockSize > 0 && !mixError ? `${Math.round((Number(mix[key]) / blockSize) * 100)}%` : "—"}
                </p>
              </label>
            );
          })}
        </div>
        <p className={`mt-3 text-xs ${mixError ? "text-rose-600" : "text-muted"}`}>
          {mixError ?? `Total ${mixTotal} of ${blockSize} cards per block.`}
        </p>
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
                  const toggleLabel = TOGGLE_LABELS[key];
                  if (toggleLabel) {
                    const on = Number(cur) > 0;
                    return (
                      <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                        <span>
                          <span className="block text-xs font-mono font-medium text-foreground/80">{key}</span>
                          <span className="block text-[11px] text-muted">{toggleLabel}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.checked ? "1" : "0" }))}
                          className="size-4 accent-[color:var(--accent)]"
                        />
                      </label>
                    );
                  }
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
