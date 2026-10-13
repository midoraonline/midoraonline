"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { BTN_SECONDARY, PageSkeleton } from "@/components/dashboard/ui";
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

  if (loading) return <PageSkeleton rows={6} label="Loading listing" />;

  if (error || !product) {
    return (
      <div className="max-w-md py-10">
        <h1 className="text-xl font-semibold tracking-tight">Listing not found</h1>
        <p className="mt-1 text-sm text-muted">
          {error || "This listing doesn't exist, or it isn't yours to edit."}
        </p>
        <Link href="/merchant/listings" className={`mt-5 ${BTN_SECONDARY}`}>
          Back to listings
        </Link>
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
      flush
    />
  );
}
