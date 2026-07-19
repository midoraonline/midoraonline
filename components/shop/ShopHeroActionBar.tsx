"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductFormModal from "@/components/shop/ProductFormModal";
import ShopActions from "@/components/shop/ShopActions";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";

/**
 * The single, canonical action bar for a shop's public page. Sits directly
 * below the hero on plain background so labels are always readable.
 *
 * Layout:
 *   [ Like ] [ Follow ] [ Share ]           [ Add product ] [ Edit ] [ Analytics ]
 *   (always)                                (owner only)
 *
 * On mobile the two groups stack; on sm+ they occupy opposite ends of the row.
 */
export default function ShopHeroActionBar({
  shopId,
  shopSlug,
  shopName,
  shopLogoUrl,
}: {
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopLogoUrl?: string | null;
}) {
  const session = useAppSession();
  const canManage = canManageShopStorefront(session, shopId);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="dm-container flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <ShopActions
            shopSlug={shopSlug}
            shopName={shopName}
            shopId={shopId}
          />

          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="dm-btn dm-btn-primary dm-btn-sm"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add product
              </button>
              <Link
                href={`/shops/${shopSlug}/edit`}
                className="dm-btn dm-btn-secondary dm-btn-sm"
              >
                <MaterialSymbol
                  name="edit"
                  className="!text-sm"
                  aria-hidden="true"
                />
                Edit shop
              </Link>
              <Link
                href={`/shops/${shopSlug}/analytics`}
                className="dm-btn dm-btn-secondary dm-btn-sm"
              >
                <MaterialSymbol
                  name="insights"
                  className="!text-sm"
                  aria-hidden="true"
                />
                Analytics
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {addOpen ? (
        <ProductFormModal
          mode="add"
          shopId={shopId}
          itemType="product"
          shopLogoUrl={shopLogoUrl}
          onClose={() => setAddOpen(false)}
          onSaved={() => setAddOpen(false)}
        />
      ) : null}
    </>
  );
}
