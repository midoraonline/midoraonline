import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { checkListingQuality, type ListingQualityRequest, type ListingQualityResponse } from "@/lib/api/aiListing";
import type { FormDraft, SetDraft } from "./types";

export type SuggestionKey = "title" | "description" | "category";

/** AI quality verdict for the draft, plus accept/dismiss of its suggested replacements. */
export function useAiReview(draft: FormDraft, setDraft: SetDraft, buildRequest: () => ListingQualityRequest) {
  const [aiCheck, setAiCheck] = useState<ListingQualityResponse | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [dismissed, setDismissed] = useState<Partial<Record<SuggestionKey, boolean>>>({});

  // A manual edit drops the stale verdict; applying one suggestion sets this
  // ref first so it doesn't wipe the other suggestions still pending review.
  const applyingSuggestionRef = useRef(false);
  const metaKey = JSON.stringify(draft.meta);
  useEffect(() => {
    if (applyingSuggestionRef.current) {
      applyingSuggestionRef.current = false;
      return;
    }
    setAiCheck(null);
    setDismissed({});
  }, [draft.title, draft.description, draft.category, draft.image_urls.length, draft.price_ugx, draft.location_name, metaKey]);

  async function runQualityCheck() {
    if (aiChecking) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error("Add a title and description before running the AI check.");
      return;
    }
    setAiChecking(true);
    try {
      const result = await checkListingQuality(buildRequest());
      setAiCheck(result);
      if (result.ok) {
        toast.success("AI review passed", { description: result.feedback });
      } else {
        toast.warning("AI review found issues", { description: result.feedback });
      }
    } catch (err) {
      toast.error("AI review failed", {
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setAiChecking(false);
    }
  }

  const dismiss = (key: SuggestionKey) => setDismissed((s) => ({ ...s, [key]: true }));

  function apply(key: SuggestionKey, patch: Partial<FormDraft>) {
    applyingSuggestionRef.current = true;
    setDraft((d) => ({ ...d, ...patch }));
    dismiss(key);
    // Clearing the verdict lets the next save re-check the edited copy instead of blocking on ok=false.
    setAiCheck(null);
  }

  function applySuggestion(key: SuggestionKey) {
    if (!aiCheck) return;
    if (key === "title" && aiCheck.suggested_title) apply(key, { title: aiCheck.suggested_title });
    if (key === "description" && aiCheck.suggested_description) {
      apply(key, { description: aiCheck.suggested_description });
    }
    if (key === "category" && aiCheck.suggested_category) {
      apply(key, { category: aiCheck.suggested_subcategory || aiCheck.suggested_category });
    }
  }

  return { aiCheck, setAiCheck, aiChecking, setAiChecking, dismissed, dismiss, runQualityCheck, applySuggestion };
}

export type AiReviewState = ReturnType<typeof useAiReview>;
