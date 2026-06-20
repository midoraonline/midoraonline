"use client";

import { useEffect, useState } from "react";
import { apiProducts } from "@/lib/api";
import type { SimilarProduct } from "@/lib/api/products";
import type { ProductCardData } from "@/components/productcard";
import ProductCard from "@/components/productcard";
import { productPageSlug } from "@/lib/productUrl";

type Props = {
  productId: string;
};

function toCard(p: SimilarProduct): ProductCardData {
  return {
    id: p.id,
    slug: productPageSlug(p),
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent: p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
      ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
      : 0,
    imageUrl: p.image_urls?.[0] ?? undefined,
    stockQuantity: null,
    viewCount: p.view_count,
    category: p.category ?? null,
    location_name: p.location_name ?? null,
    shopWhatsApp: p.shop_whatsapp ?? null,
    sellerId: p.owner_id ?? null,
    shop: {
      id: p.shop_id,
      name: p.shop_name ?? "Shop",
      slug: p.shop_slug ?? p.shop_id,
      verified: false,
      category: null,
      trust_score: null,
      available_now: null,
      location: null,
    },
    boosted: false,
    updated_at: p.created_at ?? null,
  };
}

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
            <ProductCard product={toCard(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}
