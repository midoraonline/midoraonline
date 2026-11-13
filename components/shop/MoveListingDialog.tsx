"use client";

import { useState } from "react";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { apiProducts } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import { OTHER_LISTINGS_LABEL, shopAcceptsKind, shopTypeLabel } from "@/lib/shop/shopFit";
import { ShopAvatar } from "@/components/shop/ShopAvatar";

export type MoveTarget = { id: string; name: string; shop_type?: string | null; logo_url?: string | null };

/** Choose one of the owner's shops, or Other (no shop), for an existing listing. */
export default function MoveListingDialog({
  product,
  shops,
  onMoved,
  onClose,
}: {
  product: Product;
  shops: MoveTarget[];
  onMoved: (product: Product) => void;
  onClose: () => void;
}) {
  const OTHER = "__other__";
  const current = shops.some((s) => s.id === product.shop_id) ? product.shop_id : OTHER;
  const [choice, setChoice] = useState<string>(current);
  const [busy, setBusy] = useState(false);
  const fitting = shops.filter((s) => shopAcceptsKind(s.shop_type, product.item_type));

  async function submit() {
    if (choice === current) return onClose();
    setBusy(true);
    try {
      const moved = await apiProducts.moveProduct(product.id, choice === OTHER ? null : choice);
      toast.success(choice === OTHER ? "Moved to Other listings" : "Listing moved");
      onMoved(moved);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't move the listing.");
    } finally {
      setBusy(false);
    }
  }

  const row = (id: string, shop: MoveTarget | null, label: string, hint: string) => (
    <label
      key={id}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25 ${
        choice === id ? "border-accent bg-accent/5" : "border-border hover:bg-surface-muted"
      }`}
    >
      <input type="radio" name="move-target" checked={choice === id} onChange={() => setChoice(id)} className="sr-only" />
      <ShopAvatar shop={shop} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
      {id === current ? (
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">Current</span>
      ) : (
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
            choice === id ? "border-accent bg-accent" : "border-border-input"
          }`}
          aria-hidden
        >
          {choice === id ? <span className="size-1.5 rounded-full bg-white" /> : null}
        </span>
      )}
    </label>
  );

  return (
    <FormModal
      title="Move listing"
      onClose={busy ? () => {} : onClose}
      maxWidthClass="sm:max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="dm-btn dm-btn-ghost dm-btn-sm">
            Cancel
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy || choice === current} className="dm-btn dm-btn-primary dm-btn-sm">
            {busy ? "Moving…" : "Move"}
          </button>
        </div>
      }
    >
      <p className="mb-3 truncate text-sm text-muted">“{product.title || "This listing"}”</p>
      <div className="space-y-2">
        {fitting.map((s) => row(s.id, s, s.name, shopTypeLabel(s.shop_type)))}
        {row(OTHER, null, OTHER_LISTINGS_LABEL, "Not under any shop")}
      </div>
      {fitting.length < shops.length ? (
        <p className="mt-3 text-xs text-muted">Shops that don&apos;t sell this type of listing aren&apos;t shown.</p>
      ) : null}
    </FormModal>
  );
}
