"use client";

import { useEffect, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { SimilarProduct } from "@/lib/api/products";
import type { ProductCardData } from "@/components/productcard";
import ProductCard from "@/components/productcard";
import { similarProductToCard } from "@/lib/productCardMap";

type Props = {
  productId: string;
};

export default function SimilarProducts({ productId }: Props) {
  const [items, setItems] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [productId]);

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
