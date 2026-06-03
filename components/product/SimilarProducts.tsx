"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiProducts } from "@/lib/api";
import type { SimilarProduct } from "@/lib/api/products";
import { productPageSlug } from "@/lib/productUrl";
import { MaterialSymbol } from "@/components/MaterialSymbol";

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
        {items.map((p) => {
          const slug = productPageSlug(p);
          const img = p.image_urls?.[0];
          return (
            <Link
              key={p.id}
              href={`/products/${slug}`}
              className="group w-36 shrink-0 rounded-xl border border-foreground/[0.08] bg-card p-2 transition-shadow hover:shadow-sm"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-foreground/[0.04]">
                {img ? (
                  <img
                    src={img}
                    alt={p.title}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted">
                    <MaterialSymbol name="image" className="!text-2xl" />
                  </div>
                )}
              </div>
              <p className="mt-1.5 truncate text-[11px] font-medium">{p.title}</p>
              <p className="text-[11px] font-semibold tabular-nums">
                UGX {p.price_ugx.toLocaleString()}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
