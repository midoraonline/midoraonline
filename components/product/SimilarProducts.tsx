"use client";

import { useEffect, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { SimilarProduct } from "@/lib/api/products";
import ProductCard from "@/components/productcard";
import { similarProductToCard } from "@/lib/productCardMap";

type Props = {
  productId: string;
  initialItems?: SimilarProduct[];
};

export default function SimilarProducts({ productId, initialItems }: Props) {
  const [items, setItems] = useState<SimilarProduct[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    if (initialItems !== undefined) {
      setItems(initialItems);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiProducts.getSimilarProducts(productId, 12).then((data) => {
      if (!cancelled) {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [productId, initialItems]);

  if (loading || items.length === 0) return null;

  return (
    <div className="dm-card p-4 sm:p-6">
      <h2 className="text-sm font-semibold tracking-tight">Similar products</h2>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((p) => (
          <div key={p.id} className="w-64 shrink-0">
            <ProductCard product={similarProductToCard(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}
