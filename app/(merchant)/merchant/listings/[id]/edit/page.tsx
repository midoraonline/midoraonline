"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { apiProducts } from "@/lib/api";
import type { Product } from "@/lib/api/products";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiProducts
      .getProduct(productId)
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("Listing not found.");
        } else {
          setProduct(data);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load listing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading listing details…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[color:var(--error-subtle)] text-[color:var(--error)]">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Listing not found</h1>
        <p className="text-xs text-muted leading-relaxed">
          {error || "The requested listing could not be found or you do not have permission to edit it."}
        </p>
        <div className="pt-2">
          <Link href="/merchant/listings" className="dm-btn dm-btn-secondary dm-btn-md">
            Return to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProductFormPage
      mode="edit"
      product={product}
      shopId={product.shop_id}
      itemType={product.item_type ?? "product"}
      backUrl="/merchant/listings"
    />
  );
}
