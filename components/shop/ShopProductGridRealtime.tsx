"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/productcard";
import { apiProducts } from "@/lib/api";
import type { Product } from "@/lib/api/products";
import { publicSiteOrigin } from "@/lib/publicSite";
import { productPageSlug } from "@/lib/productUrl";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { shopInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { useRealtimeTable } from "@/lib/realtime/hooks";

type ShopContext = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl?: string | null;
  whatsappNumber?: string | null;
  category?: string | null;
  ownerId?: string | null;
};

type Props = {
  shop: ShopContext;
  initialProducts: Product[];
};

function toCard(product: Product, shop: ShopContext, listingBase: string): ProductCardData {
  const slug = productPageSlug(product);
  return {
    id: product.id,
    slug,
    title: product.title,
    priceUGX: apiProducts.productPriceUgx(product),
    imageUrl: apiProducts.productPrimaryImage(product),
    shopLogoUrl: shop.logoUrl ?? undefined,
    shopWhatsApp: null,
    listingUrl: `${listingBase}/products/${slug}`,
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      verified: shop.verified,
      category: shop.category ?? null,
    },
    category: product.category ?? null,
    description: product.description ?? null,
    inShopContext: true,
    sellerId: shop.ownerId ?? null,
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
  const listingBase = useMemo(() => publicSiteOrigin(), []);

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
      if (row.is_published === false) {
        setProducts((prev) => prev.filter((p) => p.id !== row.id));
        return;
      }
      setProducts((prev) => upsert(prev, row));
    }
  );

  const visible = useMemo(
    () => products.filter((p) => p.is_published !== false),
    [products],
  );

  const shopWa = useMemo(() => {
    const n = shop.whatsappNumber?.trim();
    if (!n) return null;
    return shopInquiryWhatsAppUrl(n, {
      shopName: shop.name,
      shopUrl: `${listingBase}/shops/${shop.slug}`,
    });
  }, [listingBase, shop.name, shop.slug, shop.whatsappNumber]);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] px-6 py-10 text-center sm:px-10">
        <p className="text-sm font-medium text-foreground">No listings yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          This shop hasn&apos;t published products or services. Check back later, or message the owner if
          you&apos;d like to enquire.
        </p>
        {shopWa ? (
          <a
            href={shopWa}
            target="_blank"
            rel="noopener noreferrer"
            className="dm-focus mx-auto mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-95"
          >
            <WhatsAppIcon className="size-3.5 shrink-0 text-white" />
            WhatsApp
          </a>
        ) : null}
        <p className="mt-6 text-xs text-muted">
          <Link href="/shops" className="font-semibold text-foreground/90 underline-offset-2 hover:underline">
            Browse more shops
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      {visible.map((p) => (
        <ProductCard key={p.id} product={toCard(p, shop, listingBase)} />
      ))}
    </div>
  );
}
