"use client";

import { useEffect, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { SimilarProduct } from "@/lib/api/products";
import ProductCard from "@/components/productcard";
import { browseProductGridClass } from "@/lib/browseCategories";
import { similarProductToCard } from "@/lib/productCardMap";

type Props = {
  productId: string;
  initialItems?: SimilarProduct[];
};

export default function SimilarProducts({ productId, initialItems }: Props) {
  const [fetched, setFetched] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(initialItems === undefined);

  useEffect(() => {
    if (initialItems !== undefined) return;
    let cancelled = false;
    apiProducts.getSimilarProducts(productId, 12).then((data) => {
      if (!cancelled) {
        setFetched(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [productId, initialItems]);

  const items = initialItems ?? fetched;
  if (loading || items.length === 0) return null;

  return (
    <div className="dm-card p-4 sm:p-6">
      <h2 className="text-sm font-semibold tracking-tight">Similar products</h2>
      <div className={`mt-4 ${browseProductGridClass}`}>
        {items.map((p) => (
          <div key={p.id} className="h-full">
            <ProductCard product={similarProductToCard(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}
