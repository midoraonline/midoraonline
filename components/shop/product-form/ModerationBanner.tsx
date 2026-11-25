import { AlertTriangle, Clock } from "lucide-react";
import type { Product } from "@/lib/api/products";

/** Moderation status when editing a rejected or pending listing. */
export default function ModerationBanner({ product }: { product: Product }) {
  const rejected = product.status === "rejected";
  const pending = product.status === "pending_review";
  if (!rejected && !pending) return null;
  const notes = product.review_notes ?? "";
  const tone = rejected
    ? "border-[color:var(--error)]/40 bg-[color:var(--error)]/10 text-[color:var(--error)]"
    : "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300";
  const Icon = rejected ? AlertTriangle : Clock;
  const heading = rejected ? "Not approved by moderation" : notes ? "Under review" : "In review — awaiting approval";
  const body =
    notes || "Automated checks usually finish within a minute. Your listing goes live automatically once approved.";
  const hint = rejected
    ? "Fix the flagged content below and save — it re-enters the queue automatically."
    : notes
      ? "Edit the title, description, or photos and save — it will be re-reviewed automatically."
      : null;
  return (
    <div role="status" className={`flex gap-3 rounded-xl border p-4 text-sm ${tone}`}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{heading}</p>
        <p className="text-xs leading-relaxed opacity-95">{body}</p>
        {hint ? <p className="text-xs opacity-80 font-medium">{hint}</p> : null}
      </div>
    </div>
  );
}
