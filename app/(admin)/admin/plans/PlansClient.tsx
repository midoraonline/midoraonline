"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import { ApiError } from "@/lib/api/base";
import type { BoostPlan } from "@/lib/api/boostPlans";
import {
  ADMIN_BOOST_PACKAGES_KEY,
  ADMIN_PLANS_KEY,
  createBoostPackage,
  listAdminPlans,
  listBoostPackages,
  updateAdminPlan,
  updateBoostPackage,
  type AdminPlan,
  type AdminPlanPatch,
} from "@/lib/api/adminPlans";
import { BTN_PRIMARY, CARD, ErrorState, INPUT, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

function failure(what: string, err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 503) return `${what}: run migration 058 first.`;
    return `${what}: ${err.message}`;
  }
  return `Couldn't save ${what.toLowerCase()}.`;
}

type NumField = {
  key: keyof AdminPlan;
  label: string;
  hint?: string;
  min: number;
  max: number;
};

const SECTIONS: { title: string; fields: NumField[] }[] = [
  {
    title: "Price",
    fields: [
      { key: "price_ugx", label: "Price (UGX)", min: 0, max: 100_000_000 },
      { key: "billing_period_days", label: "Duration (days)", min: 1, max: 3650 },
    ],
  },
  {
    title: "Listings",
    fields: [
      { key: "max_shops", label: "Max shops", min: 0, max: 1000 },
      { key: "max_products_per_shop", label: "Max listings per shop", min: 0, max: 100_000 },
      { key: "frequency_per_day", label: "Feed appearances / day", min: 0, max: 1000 },
      { key: "frequency_per_day_boosted", label: "Appearances / day (boosted)", min: 0, max: 1000 },
    ],
  },
  {
    title: "Media",
    fields: [
      { key: "max_photos", label: "Max photos", hint: "1–20", min: 1, max: 20 },
      { key: "max_videos", label: "Max videos", hint: "0–5", min: 0, max: 5 },
    ],
  },
  {
    title: "Boosts & reposts",
    fields: [
      { key: "free_boosts_per_month", label: "Free boosts / month", min: 0, max: 1000 },
      { key: "reposts_per_day", label: "Reposts / day", min: 0, max: 100 },
      { key: "repost_cooldown_hours", label: "Repost cooldown (hours)", hint: "Per listing", min: 0, max: 720 },
    ],
  },
];

type Draft = Record<string, string | boolean>;

function toDraft(p: AdminPlan): Draft {
  const d: Draft = {
    name: p.name,
    analytics_enabled: Boolean(p.analytics_enabled),
    is_active: p.is_active !== false,
    features: (p.features ?? []).join("\n"),
  };
  for (const s of SECTIONS) for (const f of s.fields) d[f.key] = String(p[f.key] ?? "");
  return d;
}

function PlanCard({ plan }: { plan: AdminPlan }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(plan));
  const [saving, setSaving] = useState(false);
  const fields = SECTIONS.flatMap((s) => s.fields);
  const bad = fields.filter((f) => {
    const v = String(draft[f.key]).trim();
    const n = Number(v);
    return v === "" || !Number.isInteger(n) || n < f.min || n > f.max;
  });
  const nameOk = String(draft.name).trim().length > 0;
  const initial = toDraft(plan);
  const dirty = Object.keys(draft).some((k) => draft[k] !== initial[k]);

  async function save() {
    if (bad.length || !nameOk) return;
    const patch: AdminPlanPatch = {
      name: String(draft.name).trim(),
      analytics_enabled: Boolean(draft.analytics_enabled),
      is_active: Boolean(draft.is_active),
      features: String(draft.features)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    for (const f of fields) (patch as Record<string, unknown>)[f.key] = Number(draft[f.key]);
    setSaving(true);
    try {
      const saved = await updateAdminPlan(plan.key, patch);
      await globalMutate(
        ADMIN_PLANS_KEY,
        (prev: AdminPlan[] | undefined) => prev?.map((p) => (p.key === plan.key ? saved : p)),
        { revalidate: false },
      );
      setDraft(toDraft(saved));
      void globalMutate("settings-public");
      toast.success(`${saved.name} plan saved`);
    } catch (err) {
      toast.error(failure(`${plan.name} plan`, err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id={`plan-${plan.key}`} className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">
          {plan.name} <span className="text-xs font-normal text-muted">({plan.key})</span>
        </h2>
        {plan.updated_at ? (
          <span className="text-xs text-muted">Edited {new Date(plan.updated_at).toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted">Using built-in defaults</span>
        )}
      </div>
      <label className="mt-3 block text-xs font-semibold text-foreground-muted">
        Display name
        <input
          value={String(draft.name)}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          maxLength={60}
          aria-invalid={!nameOk}
          className={`${INPUT} mt-1`}
        />
      </label>
      {SECTIONS.map((s) => (
        <fieldset key={s.title} className="mt-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted">{s.title}</legend>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {s.fields.map((f) => (
              <label key={f.key} className="block text-xs font-medium text-foreground-muted">
                {f.label}
                {f.hint ? <span className="text-muted"> · {f.hint}</span> : null}
                <input
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  value={String(draft[f.key])}
                  aria-invalid={bad.includes(f)}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className={`${INPUT} mt-1`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="mt-4 space-y-1">
        <SettingsSwitch
          label="Analytics"
          hint="Merchants on this plan see listing analytics"
          checked={Boolean(draft.analytics_enabled)}
          onChange={(v) => setDraft((d) => ({ ...d, analytics_enabled: v }))}
        />
        <SettingsSwitch
          label="Available for purchase"
          hint="Turn off to hide this plan from billing"
          checked={Boolean(draft.is_active)}
          onChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
        />
      </div>
      <label className="mt-4 block text-xs font-semibold text-foreground-muted">
        Features (one per line, shown on pricing)
        <textarea
          rows={4}
          value={String(draft.features)}
          onChange={(e) => setDraft((d) => ({ ...d, features: e.target.value }))}
          className={`${INPUT} mt-1 min-h-24`}
        />
      </label>
      {bad.length ? (
        <p className="mt-2 text-xs text-[color:var(--error)]">
          Check: {bad.map((f) => `${f.label} (${f.min}–${f.max})`).join(", ")}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        {dirty ? (
          <button
            type="button"
            onClick={() => setDraft(initial)}
            className="dm-focus rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-muted"
          >
            Reset
          </button>
        ) : null}
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={!dirty || saving || bad.length > 0 || !nameOk}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save plan"}
        </button>
      </div>
    </section>
  );
}

type PkgDraft = { name: string; duration_hours: string; price_amount: string; score_bonus: string; is_active: boolean };
const pkgDraft = (p?: BoostPlan): PkgDraft => ({
  name: p?.name ?? "",
  duration_hours: p ? String(p.duration_hours) : "168",
  price_amount: p ? String(p.price_amount) : "10000",
  score_bonus: p ? String(p.score_bonus) : "50",
  is_active: p?.is_active ?? true,
});
function pkgValid(d: PkgDraft) {
  const h = Number(d.duration_hours);
  const pr = Number(d.price_amount);
  const s = Number(d.score_bonus);
  return (
    d.name.trim().length > 0 &&
    Number.isInteger(h) && h >= 1 && h <= 2160 &&
    pr >= 0 && pr <= 100_000_000 &&
    Number.isInteger(s) && s >= 0 && s <= 500
  );
}

function PackageRow({ pkg, onSaved }: { pkg?: BoostPlan; onSaved: (p: BoostPlan) => void }) {
  const [d, setD] = useState<PkgDraft>(() => pkgDraft(pkg));
  const [saving, setSaving] = useState(false);
  const initial = pkgDraft(pkg);
  const dirty = (Object.keys(d) as (keyof PkgDraft)[]).some((k) => d[k] !== initial[k]);
  const ok = pkgValid(d);

  async function save() {
    if (!ok) return;
    setSaving(true);
    const body = {
      name: d.name.trim(),
      duration_hours: Number(d.duration_hours),
      price_amount: Number(d.price_amount),
      score_bonus: Number(d.score_bonus),
      is_active: d.is_active,
    };
    try {
      const saved = pkg ? await updateBoostPackage(pkg.id, body) : await createBoostPackage(body);
      onSaved(saved);
      setD(pkg ? pkgDraft(saved) : pkgDraft());
      toast.success(pkg ? "Boost package saved" : "Boost package added");
    } catch (err) {
      toast.error(failure("Boost package", err));
    } finally {
      setSaving(false);
    }
  }

  const cell = `${INPUT} min-w-0`;
  return (
    <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] sm:items-center">
      <input aria-label="Package name" placeholder="e.g. Boost 7 days" value={d.name} maxLength={60}
        onChange={(e) => setD({ ...d, name: e.target.value })} className={`${cell} col-span-2 sm:col-span-1`} />
      <input aria-label="Duration hours" type="number" inputMode="numeric" min={1} max={2160} value={d.duration_hours}
        onChange={(e) => setD({ ...d, duration_hours: e.target.value })} className={cell} />
      <input aria-label="Price UGX" type="number" inputMode="numeric" min={0} value={d.price_amount}
        onChange={(e) => setD({ ...d, price_amount: e.target.value })} className={cell} />
      <input aria-label="Score weight" type="number" inputMode="numeric" min={0} max={500} value={d.score_bonus}
        onChange={(e) => setD({ ...d, score_bonus: e.target.value })} className={cell} />
      <label className="flex items-center gap-2 text-xs text-foreground-muted">
        <input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} />
        Active
      </label>
      <button type="button" className={BTN_PRIMARY} disabled={!dirty || !ok || saving} onClick={() => void save()}>
        {saving ? "…" : pkg ? "Save" : "Add"}
      </button>
    </div>
  );
}

function BoostPackagesCard() {
  const { data, error, isLoading, mutate } = useSWR(ADMIN_BOOST_PACKAGES_KEY, listBoostPackages);
  const upsert = (p: BoostPlan) =>
    void mutate((prev) => {
      const list = prev ?? [];
      return list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p];
    }, { revalidate: false });

  return (
    <section id="boosts" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
      <h2 className="text-base font-semibold text-foreground">Boost packages</h2>
      <p className="mt-0.5 text-sm text-muted">
        A boost adds its score weight to the listing&apos;s ranking for the duration and shows a Boosted badge. 50 ≈ the
        old standard boost.
      </p>
      <div className="mt-3 hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] gap-2 text-xs font-semibold text-foreground-muted sm:grid">
        <span>Name</span><span>Hours</span><span>Price (UGX)</span><span>Score weight</span><span>Status</span><span />
      </div>
      {error ? <ErrorState message={failure("Boost packages", error)} onRetry={() => void mutate()} /> : null}
      {isLoading && !data ? <PageSkeleton rows={2} label="Loading boost packages" /> : null}
      <div className="divide-y divide-border">
        {(data ?? []).map((p) => (
          <PackageRow key={`${p.id}-${p.name}-${p.price_amount}-${p.duration_hours}-${p.score_bonus}-${p.is_active}`} pkg={p} onSaved={upsert} />
        ))}
        {data ? <PackageRow key={`new-${data.length}`} onSaved={upsert} /> : null}
      </div>
    </section>
  );
}

export default function PlansClient() {
  const { data, error, isLoading, mutate } = useSWR(ADMIN_PLANS_KEY, listAdminPlans);
  return (
    <div>
      <PageHeader
        title="Plans"
        description="Everything a plan includes: price, duration, listing caps, media limits, boosts, reposts and analytics. Changes apply within a minute."
      />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label="Jump to">
        {(data ?? []).map((p) => (
          <a key={p.key} href={`#plan-${p.key}`} className="dm-focus rounded-full border border-border px-3 py-1 text-muted hover:text-foreground">
            {p.name}
          </a>
        ))}
        <a href="#boosts" className="dm-focus rounded-full border border-border px-3 py-1 text-muted hover:text-foreground">
          Boost packages
        </a>
      </nav>
      {error ? <ErrorState message={failure("Plans", error)} onRetry={() => void mutate()} /> : null}
      {isLoading && !data ? <PageSkeleton rows={6} label="Loading plans" /> : null}
      <div id="media-limits" className="grid scroll-mt-24 grid-cols-1 gap-5 xl:grid-cols-3">
        {(data ?? []).map((p) => (
          <PlanCard key={`${p.key}-${p.updated_at ?? ""}`} plan={p} />
        ))}
      </div>
      <div className="mt-6">
        <BoostPackagesCard />
      </div>
    </div>
  );
}
