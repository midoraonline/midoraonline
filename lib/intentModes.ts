/**
 * Admin Offer/Seek modes for the posting form. Until GET /categories/intent-modes answers
 * (or when it fails) the code defaults in lib/listingIntent.ts apply. The API stays authoritative.
 */
import { isIntentMode, isOpportunityCategory, type IntentModeOverrides } from "@/lib/listingIntent";

let current: IntentModeOverrides = {};

/** API rows → overrides; anything malformed is dropped so the code default applies. */
export function overridesFromRows(rows: unknown): IntentModeOverrides {
  if (!Array.isArray(rows)) return {};
  const out: IntentModeOverrides = {};
  for (const row of rows) {
    const r = row as { opportunity_category?: unknown; intent_mode?: unknown } | null;
    if (r && isOpportunityCategory(r.opportunity_category) && isIntentMode(r.intent_mode)) {
      out[r.opportunity_category] = r.intent_mode;
    }
  }
  return out;
}

/** Last loaded overrides (empty = code defaults). Read by the form helpers' default argument. */
export function currentIntentModes(): IntentModeOverrides {
  return current;
}

export function setIntentModes(next: IntentModeOverrides): void {
  current = next;
}
