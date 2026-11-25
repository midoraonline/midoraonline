import { Sparkles } from "lucide-react";
import { BTN_GHOST, BTN_SECONDARY, StatusDot } from "@/components/dashboard/ui";
import type { CategoryParts } from "@/lib/categories";
import type { FormDraft } from "./types";
import type { AiReviewState } from "./useAiReview";

/** AI-authored replacement for a single field — merchant explicitly accepts or dismisses it. */
function SuggestionRow({
  label,
  value,
  multiline = false,
  onUse,
  onDismiss,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onUse: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-sm text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={onUse} className={BTN_SECONDARY}>
          Use this
        </button>
        <button type="button" onClick={onDismiss} className={BTN_GHOST}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

/** Runs on the whole listing, so it sits after every field. */
export default function AiReviewSection({
  ai,
  kind,
  categoryParts,
}: {
  ai: AiReviewState;
  kind: FormDraft["kind"];
  categoryParts: CategoryParts;
}) {
  const { aiCheck, aiChecking, dismissed, dismiss, applySuggestion } = ai;
  const showCategory =
    kind === "product" &&
    aiCheck?.suggested_category &&
    !dismissed.category &&
    (aiCheck.suggested_subcategory || aiCheck.suggested_category) !==
      (categoryParts.subcategoryLabel || categoryParts.parentLabel);
  return (
    <section aria-labelledby="ai-review-heading" className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="ai-review-heading" className="text-sm font-semibold text-foreground">Check quality with AI</h2>
          <p className="mt-0.5 text-sm text-muted">
            Reviews your photos, text and every field above, then points out what&apos;s missing or weak.
          </p>
        </div>
        <button type="button" onClick={() => void ai.runQualityCheck()} disabled={aiChecking} className={BTN_SECONDARY}>
          <Sparkles className="size-4" aria-hidden />
          {aiChecking ? "Reviewing…" : aiCheck ? "Check again" : "Check quality"}
        </button>
      </div>

      {aiCheck ? (
        <div className="space-y-4 rounded-lg border border-border bg-surface-subtle/60 p-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-foreground">{aiCheck.score}</span>
              <span className="text-sm text-muted">/100</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusDot tone={aiCheck.title_matches && aiCheck.images_match ? "ok" : "warn"}>Title matches photos</StatusDot>
              <StatusDot tone={aiCheck.description_quality !== "poor" ? "ok" : "warn"}>
                {`Description ${aiCheck.description_quality}`}
              </StatusDot>
            </div>
          </div>
          {aiCheck.feedback ? <p className="text-sm text-foreground">{aiCheck.feedback}</p> : null}
          {aiCheck.suggestions.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">What to improve</p>
              <ul className="mt-2 space-y-2">
                {aiCheck.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {aiCheck.suggested_title && !dismissed.title ? (
            <SuggestionRow
              label="Suggested title"
              value={aiCheck.suggested_title}
              onUse={() => applySuggestion("title")}
              onDismiss={() => dismiss("title")}
            />
          ) : null}
          {aiCheck.suggested_description && !dismissed.description ? (
            <SuggestionRow
              label="Suggested description"
              value={aiCheck.suggested_description}
              multiline
              onUse={() => applySuggestion("description")}
              onDismiss={() => dismiss("description")}
            />
          ) : null}
          {showCategory && aiCheck.suggested_category ? (
            <SuggestionRow
              label="Suggested category"
              value={
                aiCheck.suggested_subcategory
                  ? `${aiCheck.suggested_category} › ${aiCheck.suggested_subcategory}`
                  : aiCheck.suggested_category
              }
              onUse={() => applySuggestion("category")}
              onDismiss={() => dismiss("category")}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
