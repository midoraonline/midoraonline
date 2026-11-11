import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import type { ListingKind } from "@/lib/listingMeta";

const KIND_NOUN: Record<ListingKind, string> = {
  product: "product",
  service: "service",
  opportunity: "opportunity",
};

/** Empty category or search: invite the visitor to be the first to post there. */
export default function FirstToPost({
  topic,
  kind,
  className = "",
}: {
  /** What was browsed or searched, e.g. a category name or the search text. */
  topic: string | null;
  kind: ListingKind | null;
  className?: string;
}) {
  const noun = kind ? KIND_NOUN[kind] : "listing";
  const href = kind ? `/post-item?item_type=${kind}` : "/post-item";
  return (
    <div className={`flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center ${className}`}>
      <Sparkles className="size-6 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          {topic ? `Be the first to post in “${topic}”` : `Be the first to post a ${noun}`}
        </p>
        <p className="text-sm text-muted">
          Nobody has listed {topic ? "here" : "yet"}, so yours will be the first thing buyers see. It takes a minute.
        </p>
      </div>
      <Link href={href} className="dm-btn dm-btn-primary dm-btn-sm shrink-0 self-start sm:self-auto">
        <Plus className="size-4" aria-hidden />
        Post a {noun}
      </Link>
    </div>
  );
}
