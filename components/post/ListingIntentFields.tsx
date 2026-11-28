"use client";

import { PiCheckCircleFill } from "react-icons/pi";
import IntentChoice, { type IntentOption } from "@/components/post/IntentChoice";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { useIntentModes } from "@/lib/hooks/useIntentModes";
import { OPPORTUNITY_CATEGORIES, SERVICE_INTENT, allowsSeeking, parseIntent } from "@/lib/listingIntent";
import {
  OPPORTUNITY_CATEGORY_CHOICES,
  categoryLabelFor,
  draftOpportunityCategory,
  metaWithIntent,
  metaWithOpportunityCategory,
} from "@/lib/listingIntentForm";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";

const SERVICE_OPTIONS: IntentOption[] = (["offering", "seeking"] as const).map((value) => ({
  value,
  label: SERVICE_INTENT[value].option,
  hint: SERVICE_INTENT[value].example,
}));

/**
 * Service: offer or need. Opportunity: one of nine categories, then offer/seek
 * only for two-way ones (admin mode from the API, else the code default; offering-only stores offering).
 */
export default function ListingIntentFields({
  kind,
  meta,
  category,
  onChange,
  showErrors,
  error,
}: {
  kind: ListingKind;
  meta: ListingMeta;
  category: string;
  /** `category` is set when the opportunity category changes (stored as products.category). */
  onChange: (next: { meta: ListingMeta; category?: string }) => void;
  showErrors?: boolean;
  error?: string | null;
}) {
  const { items } = useCategoryItems();
  const modes = useIntentModes();
  const intent = parseIntent(meta.intent);
  const message = showErrors && error ? (
    <p className="text-xs text-[color:var(--error)]" role="alert">{error}</p>
  ) : null;

  if (kind === "service") {
    return (
      <div className="space-y-2">
        <IntentChoice
          name="service-intent"
          legend="Do you offer or need this service?"
          options={SERVICE_OPTIONS}
          value={intent}
          invalid={Boolean(showErrors && error)}
          onChange={(next) => onChange({ meta: metaWithIntent(meta, next) })}
        />
        {message}
      </div>
    );
  }
  if (kind !== "opportunity") return null;

  const selected = draftOpportunityCategory(meta, category);
  const cfg = selected ? OPPORTUNITY_CATEGORIES[selected] : null;
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">What kind of opportunity is it?</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
          {OPPORTUNITY_CATEGORY_CHOICES.map((c) => {
            const on = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() =>
                  onChange({ meta: metaWithOpportunityCategory(meta, c.id, modes), category: categoryLabelFor(c.id, items) })
                }
                className={`dm-focus relative rounded-xl border-2 px-4 py-3 pr-10 text-left transition-colors ${
                  on ? "border-accent bg-accent/[0.04]" : "border-border bg-surface hover:border-accent/50"
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{c.hint}</span>
                <PiCheckCircleFill
                  className={`absolute right-3 top-3 size-5 text-accent transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </fieldset>
      {cfg && allowsSeeking(selected, modes) ? (
        <IntentChoice
          name="opportunity-intent"
          legend="Are you offering or looking?"
          options={[
            { value: "offering", label: cfg.offerOption ?? "I'm offering this" },
            { value: "seeking", label: cfg.seekOption ?? "I'm looking for this" },
          ]}
          value={intent}
          invalid={Boolean(showErrors && error)}
          onChange={(next) => onChange({ meta: metaWithIntent(meta, next) })}
        />
      ) : null}
      {cfg && intent === "seeking" && !allowsSeeking(selected, modes) ? (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {cfg.label} now only takes listings that offer something. When you save, this listing will show as
          {" "}<strong>{cfg.offering}</strong>, not as &quot;looking for&quot;. If you&apos;re looking, pick another category.
        </p>
      ) : null}
      {message}
    </div>
  );
}
