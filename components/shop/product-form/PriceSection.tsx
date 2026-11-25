import { INPUT } from "@/components/post/StepFrame";
import type { SalePriceState } from "@/lib/schemas/listingForm";
import { parseAmount, UGX } from "./draft";
import FormSection, { FieldError, SectionHeading } from "./FormSection";
import type { SectionProps } from "./types";

function SaleHint({ sale, salePrice, showErrors }: { sale: SalePriceState; salePrice: string; showErrors: boolean }) {
  if (sale.kind === "ok") {
    return (
      <p className="text-xs font-semibold text-[color:var(--success)]">
        Buyer sees {UGX.format(parseAmount(salePrice) ?? 0)} — saves {UGX.format(sale.savings)} ({sale.percent}% off)
      </p>
    );
  }
  if (sale.kind === "invalid" && (showErrors || salePrice.trim())) {
    return <p className="text-xs text-[color:var(--error)]">{sale.message}</p>;
  }
  return <p className="text-xs text-muted">Leave blank for no discount.</p>;
}

/** Price, after-discount price, and stock (products). */
export default function PriceSection({
  draft,
  setDraft,
  showErrors,
  errors,
  invalid,
  serverMessage,
  onEdited,
  sale,
}: SectionProps & { sale: SalePriceState }) {
  const isOpportunity = draft.kind === "opportunity";
  return (
    <FormSection invalid={invalid} serverMessage={serverMessage} className="space-y-5">
      <SectionHeading title="Price">Prices are in UGX.</SectionHeading>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="product-price" className="block text-sm font-medium text-foreground">
            {isOpportunity ? "Budget / pay (UGX)" : "Price (UGX)"}
          </label>
          <input
            id="product-price"
            className={INPUT}
            inputMode="numeric"
            value={draft.price_ugx}
            onChange={(e) => {
              onEdited();
              setDraft((d) => ({ ...d, price_ugx: e.target.value }));
            }}
            aria-invalid={(showErrors && Boolean(errors.price_ugx)) || serverMessage !== null}
            placeholder={isOpportunity ? "Optional — 0 if unpaid" : "50000"}
          />
          <FieldError message={showErrors ? errors.price_ugx : null} />
        </div>
        {isOpportunity ? null : (
          <div className="space-y-1.5">
            <label htmlFor="product-sale" className="block text-sm font-medium text-foreground">
              After discount price <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="product-sale"
              className={INPUT}
              inputMode="numeric"
              value={draft.sale_price}
              onChange={(e) => setDraft((d) => ({ ...d, sale_price: e.target.value }))}
              placeholder="e.g. 40000"
            />
            <SaleHint sale={sale} salePrice={draft.sale_price} showErrors={showErrors} />
          </div>
        )}
      </div>
      {draft.kind === "product" ? (
        <div className="space-y-1.5">
          <label htmlFor="product-stock" className="block text-sm font-medium text-foreground">
            Stock quantity
          </label>
          <input
            id="product-stock"
            className={INPUT}
            inputMode="numeric"
            value={draft.stock_quantity}
            onChange={(e) => setDraft((d) => ({ ...d, stock_quantity: e.target.value }))}
            placeholder="10"
          />
        </div>
      ) : null}
    </FormSection>
  );
}
