"use client";

import ListingTypeTag from "@/components/ListingTypeTag";
import { listingTypeTagKind } from "@/lib/listingType";
import type { ListingKind, ListingMeta } from "@/lib/listingMeta";

const LINK = "dm-focus text-sm font-medium text-foreground underline underline-offset-2";

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
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2.5">
      <ListingTypeTag kind={listingTypeTagKind(kind, meta)} />
      {shopLabel ? <span className="min-w-0 truncate text-sm text-foreground">{shopLabel}</span> : null}
      {onChangeType || onChangeShop ? (
        <span className="ml-auto flex items-center gap-3">
          {onChangeShop ? (
            <button type="button" onClick={onChangeShop} className={LINK}>
              Change shop
            </button>
          ) : null}
          {onChangeType ? (
            <button type="button" onClick={onChangeType} className={LINK}>
              Change type
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
