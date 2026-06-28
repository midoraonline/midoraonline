import type { ProductCardData } from "@/components/productcard";
import type { HomeFeedProduct } from "@/lib/api/products";
import { productPageSlug } from "@/lib/productUrl";

export function homeFeedProductToCard(p: HomeFeedProduct, site: string): ProductCardData {
  const slug = productPageSlug(p);
  return {
    id: p.id,
    slug,
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent:
      p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
        ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
        : 0,
    imageUrl: p.primary_image,
    shopLogoUrl: p.shop.logo_url ?? undefined,
    stockQuantity: p.stock_quantity,
    viewCount: p.view_count,
    likeCount: p.like_count,
    isLiked: p.viewer_liked ?? undefined,
    shopWhatsApp: p.shop.whatsapp_number ?? null,
    listingUrl: `${site}/products/${slug}`,
    sellerId: p.shop.owner_id ?? null,
    shop: {
      id: p.shop.id,
      name: p.shop.name,
      slug: p.shop.slug,
      verified: p.shop.is_active,
      category: p.shop.category ?? null,
      trust_score: p.shop.trust_score ?? null,
      available_now: p.shop.available_now ?? null,
      location: p.shop.location ?? null,
    },
    category: p.category ?? null,
    boosted: p.boosted,
    updated_at: p.updated_at ?? p.created_at ?? null,
    location_name: p.location_name ?? null,
  };
}
