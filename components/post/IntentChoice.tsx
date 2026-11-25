"use client";

import { PiCheckCircleFill } from "react-icons/pi";
import type { ListingIntent } from "@/lib/listingIntent";

export type IntentOption = { value: ListingIntent; label: string; hint?: string };

/** Offer / need (or offer / seek) radio cards. */
export default function IntentChoice({
  name,
  legend,
  options,
  value,
  onChange,
  invalid,
}: {
  name: string;
  legend: string;
  options: IntentOption[];
  value: ListingIntent | null;
  onChange: (next: ListingIntent) => void;
  invalid?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div role="radiogroup" aria-invalid={invalid || undefined} className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={on}
              name={name}
              onClick={() => onChange(opt.value)}
              className={`dm-focus relative flex min-h-14 flex-col items-start justify-center rounded-xl border-2 px-4 py-3 pr-10 text-left transition-colors ${
                on
                  ? "border-accent bg-accent/[0.04]"
                  : invalid
                    ? "border-[color:var(--error)]/60 bg-surface"
                    : "border-border bg-surface hover:border-accent/50"
              }`}
            >
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
              {opt.hint ? <span className="mt-0.5 text-xs text-muted">{opt.hint}</span> : null}
              <PiCheckCircleFill
                className={`absolute right-3 top-3 size-5 text-accent transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
