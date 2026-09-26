"use client";

import type { CategoryMetaField, ListingMeta } from "@/lib/listingMeta";
import { fieldHelp, fieldKind } from "@/lib/listingMeta";

export default function CategoryMetaInputs({
  fields,
  meta,
  onChange,
  fieldErrors,
}: {
  fields: CategoryMetaField[];
  meta: ListingMeta;
  onChange: (key: string, value: string | undefined) => void;
  fieldErrors?: Record<string, string>;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = String(meta[field.key] ?? "");
        const kind = fieldKind(field);
        const help = fieldHelp(field);
        const message = fieldErrors?.[field.key];
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required ? <span className="text-[color:var(--error)]"> *</span> : null}
            </label>
            {help ? <p className="text-[11px] text-muted">{help}</p> : null}
            {kind === "select" ? (
              <select
                className="dm-input"
                value={value}
                aria-invalid={Boolean(message)}
                onChange={(e) => onChange(field.key, e.target.value || undefined)}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : kind === "boolean" ? (
              <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={value === "true"}
                  aria-invalid={Boolean(message)}
                  onChange={(e) => onChange(field.key, e.target.checked ? "true" : undefined)}
                />
                {field.placeholder || "Yes"}
              </label>
            ) : (
              <input
                className="dm-input"
                type={kind === "number" ? "number" : kind === "date" ? "date" : "text"}
                value={value}
                aria-invalid={Boolean(message)}
                onChange={(e) => onChange(field.key, e.target.value || undefined)}
                placeholder={field.placeholder}
              />
            )}
            {message ? <p className="text-xs text-[color:var(--error)]">{message}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
