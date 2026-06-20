"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { apiProducts } from "@/lib/api";

type Props = {
  shopOwnerId: string | null | undefined;
  shopSlug?: string;
  shopId: string;
  productId?: string;
  isPublished?: boolean | null;
  productPriceUgx?: number;
  productDiscountPrice?: number | null;
};

export default function ProductOwnerActions({
  shopOwnerId,
  shopSlug,
  shopId,
  productId,
  isPublished,
  productPriceUgx,
  productDiscountPrice,
}: Props) {
  const session = useAppSession();
  const router = useRouter();
  const [discountModal, setDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState(
    productDiscountPrice ? String(productDiscountPrice) : "",
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage =
    session.hydrated &&
    session.isAuthenticated &&
    (session.user?.user_role === "admin" || (shopOwnerId != null && session.user?.id === shopOwnerId));

  if (!canManage) return null;

  async function handleToggleAvailability() {
    if (!productId) return;
    setActionLoading("availability");
    try {
      await apiProducts.toggleAvailability(productId);
      router.refresh();
    } catch {
      alert("Failed to toggle availability");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetDiscount() {
    if (!productId) return;
    setActionLoading("discount");
    try {
      const val = discountValue.trim();
      const discountPrice = val ? parseFloat(val.replace(/,/g, "")) : null;
      if (val && (isNaN(discountPrice!) || discountPrice! < 0)) {
        alert("Enter a valid discount price");
        return;
      }
      if (val && discountPrice! >= (productPriceUgx ?? 0)) {
        alert("Discount price must be less than the original price");
        return;
      }
      await apiProducts.setDiscount(productId, { discount_price: discountPrice ?? null });
      setDiscountModal(false);
      router.refresh();
    } catch {
      alert("Failed to set discount");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveDiscount() {
    if (!productId) return;
    setActionLoading("remove-discount");
    try {
      await apiProducts.setDiscount(productId, { discount_price: null });
      router.refresh();
    } catch {
      alert("Failed to remove discount");
    } finally {
      setActionLoading(null);
    }
  }

  const isDiscounted = productDiscountPrice != null && productDiscountPrice > 0 && productPriceUgx != null && productDiscountPrice < productPriceUgx;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {productId && (
          <>
            <button
              type="button"
              onClick={() => void handleToggleAvailability()}
              disabled={actionLoading === "availability"}
              className="dm-focus inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.12] px-3 py-2 text-[11px] font-semibold text-foreground/80 hover:bg-foreground/[0.04] disabled:opacity-50"
            >
              <MaterialSymbol
                name={isPublished !== false ? "visibility_off" : "visibility"}
                className="!text-sm"
              />
              {actionLoading === "availability" ? "…" : isPublished !== false ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => setDiscountModal(true)}
              disabled={actionLoading === "discount"}
              className="dm-focus inline-flex items-center gap-1.5 rounded-lg border border-red-300/50 px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
            >
              <MaterialSymbol name="sell" className="!text-sm" />
              {isDiscounted ? "Edit Discount" : "Set Discount"}
            </button>
            {isDiscounted && (
              <button
                type="button"
                onClick={() => void handleRemoveDiscount()}
                disabled={actionLoading === "remove-discount"}
                className="dm-focus inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.12] px-3 py-2 text-[11px] font-semibold text-foreground/60 hover:bg-foreground/[0.04] disabled:opacity-50"
              >
                {actionLoading === "remove-discount" ? "…" : "Remove Discount"}
              </button>
            )}
          </>
        )}
      </div>

      {discountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
            <h3 className="text-sm font-semibold mb-4">
              {isDiscounted ? "Edit Discount" : "Set Discount"}
            </h3>
            <p className="text-xs text-muted mb-3">
              Original price: <strong>{productPriceUgx != null ? `UGX ${productPriceUgx.toLocaleString()}` : "-"}</strong>
            </p>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-medium text-foreground/80">Discounted price (UGX)</label>
              <input
                className="dm-input-xs dm-focus w-full"
                inputMode="numeric"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Enter discounted price"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiscountModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSetDiscount()}
                disabled={actionLoading === "discount" || !discountValue.trim()}
                className="dm-focus inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {actionLoading === "discount" ? "Saving…" : "Apply Discount"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
