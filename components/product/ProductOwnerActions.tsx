"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import FormModal from "@/components/FormModal";
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

const UGX = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type SaleState =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; savings: number; percent: number };

function evaluate(priceStr: string, price: number | undefined): SaleState {
  const trimmed = priceStr.trim();
  if (!trimmed) return { kind: "empty" };
  const sale = parseAmount(trimmed);
  if (sale === null) return { kind: "invalid", message: "Enter a valid amount." };
  if (!price || price <= 0)
    return { kind: "invalid", message: "No original price to discount from." };
  if (sale >= price)
    return { kind: "invalid", message: "Sale price must be less than the price." };
  return {
    kind: "ok",
    savings: price - sale,
    percent: Math.round(((price - sale) / price) * 100),
  };
}

export default function ProductOwnerActions({
  shopOwnerId,
  productId,
  isPublished,
  productPriceUgx,
  productDiscountPrice,
}: Props) {
  const session = useAppSession();
  const router = useRouter();
  const [discountModal, setDiscountModal] = useState(false);
  const [salePrice, setSalePrice] = useState(
    productDiscountPrice ? String(productDiscountPrice) : "",
  );
  const [pending, setPending] = useState<
    "availability" | "discount" | "remove-discount" | null
  >(null);

  const canManage =
    session.hydrated &&
    session.isAuthenticated &&
    (session.user?.user_role === "admin" ||
      (shopOwnerId != null && session.user?.id === shopOwnerId));

  const sale = useMemo(() => evaluate(salePrice, productPriceUgx), [
    salePrice,
    productPriceUgx,
  ]);

  const isDiscounted =
    productDiscountPrice != null &&
    productDiscountPrice > 0 &&
    productPriceUgx != null &&
    productDiscountPrice < productPriceUgx;

  if (!canManage) return null;

  async function handleToggleAvailability() {
    if (!productId) return;
    setPending("availability");
    const request = apiProducts.toggleAvailability(productId);
    toast.promise(request, {
      loading: isPublished !== false ? "Unpublishing…" : "Publishing…",
      success: isPublished !== false ? "Listing hidden" : "Listing published",
      error: "Could not update visibility.",
    });
    try {
      await request;
      router.refresh();
    } catch {
      /* handled */
    } finally {
      setPending(null);
    }
  }

  async function handleSetDiscount() {
    if (!productId || sale.kind !== "ok") return;
    const priceValue = parseAmount(salePrice);
    if (priceValue == null) return;
    setPending("discount");
    const request = apiProducts.setDiscount(productId, {
      discount_price: priceValue,
    });
    toast.promise(request, {
      loading: "Applying discount…",
      success: `Discount applied — ${sale.percent}% off`,
      error: "Could not apply discount.",
    });
    try {
      await request;
      setDiscountModal(false);
      router.refresh();
    } catch {
      /* handled */
    } finally {
      setPending(null);
    }
  }

  async function handleRemoveDiscount() {
    if (!productId) return;
    setPending("remove-discount");
    const request = apiProducts.setDiscount(productId, { discount_price: null });
    toast.promise(request, {
      loading: "Removing discount…",
      success: "Discount removed",
      error: "Could not remove discount.",
    });
    try {
      await request;
      router.refresh();
    } catch {
      /* handled */
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {productId && (
          <>
            <button
              type="button"
              onClick={() => void handleToggleAvailability()}
              disabled={pending === "availability"}
              className="dm-btn dm-btn-secondary dm-btn-sm"
            >
              <MaterialSymbol
                name={isPublished !== false ? "visibility_off" : "visibility"}
                className="!text-sm"
                aria-hidden="true"
              />
              {isPublished !== false ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => setDiscountModal(true)}
              disabled={pending === "discount"}
              className="dm-btn dm-btn-secondary dm-btn-sm"
            >
              <MaterialSymbol name="sell" className="!text-sm" aria-hidden="true" />
              {isDiscounted ? "Edit discount" : "Set discount"}
            </button>
            {isDiscounted && (
              <button
                type="button"
                onClick={() => void handleRemoveDiscount()}
                disabled={pending === "remove-discount"}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Remove discount
              </button>
            )}
          </>
        )}
      </div>

      {discountModal && (
        <FormModal
          title={isDiscounted ? "Edit discount" : "Set discount"}
          onClose={() => (pending === "discount" ? undefined : setDiscountModal(false))}
          maxWidthClass="sm:max-w-sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiscountModal(false)}
                disabled={pending === "discount"}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSetDiscount()}
                disabled={pending === "discount" || sale.kind !== "ok"}
                className="dm-btn dm-btn-primary"
              >
                {pending === "discount" ? "Applying…" : "Apply discount"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Original price:{" "}
              <strong className="text-foreground">
                {productPriceUgx != null ? UGX.format(productPriceUgx) : "—"}
              </strong>
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="owner-sale-price"
                className="text-sm font-medium text-foreground"
              >
                Sale price (what the buyer pays)
              </label>
              <input
                id="owner-sale-price"
                className="dm-input"
                inputMode="numeric"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="e.g. 40000"
                aria-invalid={sale.kind === "invalid"}
                autoFocus
              />
              {sale.kind === "ok" ? (
                <p className="text-xs font-medium text-[color:var(--success)]">
                  Buyer saves {UGX.format(sale.savings)} ({sale.percent}% off)
                </p>
              ) : sale.kind === "invalid" ? (
                <p className="text-xs text-[color:var(--error)]">{sale.message}</p>
              ) : (
                <p className="text-xs text-muted">
                  Enter the final price after the discount.
                </p>
              )}
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}
