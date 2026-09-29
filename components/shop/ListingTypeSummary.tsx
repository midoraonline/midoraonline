"use client";

import ListingTypeTag from "@/components/ListingTypeTag";
import { listingTypeTagKind } from "@/lib/listingType";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";

export default function ListingTypeSummary({
  kind,
  meta,
  shopLabel,
  onChangeType,
  onChangeShop,
}: {
  kind: ListingKind;
  meta?: ListingMeta | null;
  shopLabel?: string | null;
  onChangeType?: () => void;
  onChangeShop?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
      <ListingTypeTag kind={listingTypeTagKind(kind, meta)} />
      {shopLabel ? (
        <span className="min-w-0 truncate text-sm font-medium text-foreground">{shopLabel}</span>
      ) : null}
      {onChangeType || onChangeShop ? (
        <span className="ml-auto flex items-center gap-3">
          {onChangeShop ? (
            <button
              type="button"
              onClick={onChangeShop}
              className="dm-focus text-xs font-semibold text-accent"
            >
              Change shop
            </button>
          ) : null}
          {onChangeType ? (
            <button
              type="button"
              onClick={onChangeType}
              className="dm-focus text-xs font-semibold text-accent"
            >
              Change
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
