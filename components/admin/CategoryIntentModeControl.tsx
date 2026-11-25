"use client";

import { useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import type { IntentModeRow } from "@/lib/api/categories";
import { apiErrorMessage } from "@/lib/api/base";
import type { IntentMode } from "@/lib/listingIntent";

const OPTIONS: { value: IntentMode; label: string }[] = [
  { value: "bidirectional", label: "Two-way" },
  { value: "offering_only", label: "Offering only" },
];

/**
 * Offer/Seek mode for one opportunity subcategory. Applies to new and edited listings;
 * published seeking listings keep their label, and the saved count says how many there are.
 */
export default function CategoryIntentModeControl({
  row,
  onSaved,
}: {
  row: IntentModeRow;
  onSaved: (next: IntentModeRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = !row.seeking_supported;

  async function choose(mode: IntentMode) {
    if (mode === row.intent_mode || saving || locked) return;
    if (mode === "offering_only" && !window.confirm(`Make ${row.label} offering only? New and edited listings can no longer seek.`)) return;
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const out = await apiAdmin.adminSetCategoryIntentMode(row.slug, mode);
      onSaved(out);
      const n = out.affected_seeking_listings;
      setNote(mode === "offering_only" ? `Existing seeking listings left unchanged: ${n}.` : null);
      toast.success("Offer/Seek mode saved");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save the Offer/Seek mode.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs">
      <span className="font-semibold text-muted">Offer/Seek</span>
      <div className="inline-flex rounded-lg bg-surface-muted p-1" role="group" aria-label={`Offer/Seek mode for ${row.label}`}>
        {OPTIONS.map((o) => {
          const on = o.value === row.intent_mode;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={saving || (locked && !on)}
              onClick={() => void choose(o.value)}
              className={`min-h-7 rounded-md px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                on ? "bg-surface font-medium text-foreground shadow-xs" : "text-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {locked ? <span className="text-muted">Offering only: there is no &ldquo;seeking&rdquo; card label for this category.</span> : null}
      {note ? <span className="text-muted" role="status">{note}</span> : null}
      {error ? <span className="text-[color:var(--error)]" role="alert">{error}</span> : null}
    </div>
  );
}
