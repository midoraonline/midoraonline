import type { ProductCardData } from "@/components/productcard";
import type { SearchProductItem } from "@/lib/api/search";
import { productPageSlug } from "@/lib/productUrl";

export function searchItemToCard(item: SearchProductItem, site?: string): ProductCardData {
  const slug = productPageSlug(item);
  const origin = site ?? (typeof window !== "undefined" ? window.location.origin : "");
  return {
    id: item.id,
    slug,
    title: item.title,
    priceUGX: item.price_ugx,
    imageUrl: item.primary_image ?? item.image_urls?.[0] ?? undefined,
    shopLogoUrl: item.shop.logo_url ?? undefined,
    viewCount: item.view_count,
    likeCount: item.like_count,
    isLiked: item.viewer_liked ?? undefined,
    shopWhatsApp: item.shop.whatsapp_number ?? null,
    listingUrl: origin ? `${origin}/products/${slug}` : `/${slug}`,
    sellerId: item.shop.owner_id ?? null,
    shop: {
      id: item.shop.id,
      name: item.shop.name,
      slug: item.shop.slug,
      verified: item.shop.is_active,
      category: item.shop.category ?? null,
      trust_score: item.shop.trust_score ?? null,
      available_now: item.shop.available_now ?? null,
      location: item.shop.location ?? null,
    },
    category: item.category ?? null,
    boosted: item.boosted,
    updated_at: item.updated_at ?? item.created_at ?? null,
    location_name: item.location_name ?? null,
  };
}
