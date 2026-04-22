"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard, { type ProductCardData } from "@/components/productcard";
import { apiProducts } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import { productPageSlug } from "@/lib/productUrl";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type ShopContext = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl?: string | null;
};

type Props = {
  shop: ShopContext;
  initialProducts: Product[];
};

function toCard(product: Product, shop: ShopContext): ProductCardData {
  return {
    id: product.id,
    slug: productPageSlug(product),
    title: product.title,
    priceUGX: apiProducts.productPriceUgx(product),
    imageUrl: apiProducts.productPrimaryImage(product),
    shopLogoUrl: shop.logoUrl ?? undefined,
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      verified: shop.verified,
    },
  };
}

function upsert(list: Product[], next: Product): Product[] {
  const idx = list.findIndex((p) => p.id === next.id);
  if (idx === -1) return [next, ...list];
  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...next };
  return copy;
}

export default function ShopProductGridRealtime({ shop, initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useRealtimeTable(
    {
      channel: `products:shop:${shop.id}`,
      table: "products",
      event: "*",
      filter: `shop_id=eq.${shop.id}`,
    },
    (payload) => {
      if (payload.eventType === "DELETE") {
        const row = payload.old as Partial<Product> | undefined;
        if (row?.id) {
          setProducts((prev) => prev.filter((p) => p.id !== String(row.id)));
        }
        return;
      }
      const row = payload.new as Product | undefined;
      if (!row || !row.id) return;
      // Respect the server-side RLS: only `is_published = true` rows should
      // reach us, but double-check anyway in case of late invalidation.
      if (row.is_published === false) {
        setProducts((prev) => prev.filter((p) => p.id !== row.id));
        return;
      }
      setProducts((prev) => upsert(prev, row));
    }
  );

  const visible = useMemo(
    () => products.filter((p) => p.is_published !== false),
    [products]
  );

  if (visible.length === 0) {
    return (
      <div className="dm-card p-8 text-center sm:p-10">
        <p className="text-sm text-muted">
          No products listed yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {visible.map((p) => (
        <ProductCard key={p.id} product={toCard(p, shop)} />
      ))}
    </div>
  );
}
