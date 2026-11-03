"use client";

import type { ListingKind, ListingMeta } from "@/lib/listingMeta";
import { BROWSE_AREAS } from "@/lib/browseArea";

type Props = {
  kind: ListingKind;
  meta: ListingMeta;
  onChange: (meta: ListingMeta) => void;
};

const CHIP = "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";

function AreaChips({ value, onChange, label }: { value: string[]; onChange: (next: string[]) => void; label: string }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {BROWSE_AREAS.map((a) => {
          const on = value.includes(a.value);
          return (
            <button
              key={a.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== a.value) : [...value, a.value])}
              className={`${CHIP} ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground/80 hover:bg-surface-subtle"}`}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[color:var(--accent)]" />
      {label}
    </label>
  );
}

/** Where buyers can use this listing, so it shows to the right people. */
export default function ListingReachFields({ kind, meta, onChange }: Props) {
  const flag = (key: keyof ListingMeta, on: boolean) => onChange({ ...meta, [key]: on ? "yes" : undefined });

  if (kind === "product") {
    return (
      <div className="space-y-3 rounded-md border border-border p-3">
        <AreaChips
          label="Delivers to (optional)"
          value={meta.delivery_areas ?? []}
          onChange={(delivery_areas) => onChange({ ...meta, delivery_areas })}
        />
        <Toggle checked={meta.nationwide_delivery === "yes"} onChange={(on) => flag("nationwide_delivery", on)} label="I deliver anywhere in Uganda" />
      </div>
    );
  }
  if (kind === "service") {
    return (
      <div className="space-y-3 rounded-md border border-border p-3">
        <AreaChips
          label="Areas you serve"
          value={meta.service_areas ?? []}
          onChange={(service_areas) => onChange({ ...meta, service_areas })}
        />
        <Toggle checked={meta.travels_to_customer === "yes"} onChange={(on) => flag("travels_to_customer", on)} label="I travel to the customer" />
        <Toggle checked={meta.remote_service === "yes"} onChange={(on) => flag("remote_service", on)} label="I can do this remotely / online" />
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-foreground">Work mode</legend>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["on_site", "On site"],
              ["hybrid", "Hybrid"],
              ["remote", "Remote"],
            ] as const
          ).map(([value, label]) => {
            const on = meta.work_mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ ...meta, work_mode: on ? undefined : value })}
                className={`${CHIP} ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground/80 hover:bg-surface-subtle"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Toggle checked={meta.relocation_supported === "yes"} onChange={(on) => flag("relocation_supported", on)} label="Relocation supported" />
    </div>
  );
}
