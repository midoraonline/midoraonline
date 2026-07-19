import type { ProductCardData } from "@/components/productcard";
import type { HomeFeedProduct, Product, SimilarProduct, LikedProduct } from "@/lib/api/products";
import {
  isVideoUrl,
  productDiscountPercent,
  productImageUrls,
  productIsDiscounted,
  productOriginalPriceUgx,
  productPriceUgx,
  productPrimaryImage,
} from "@/lib/api/products";
import type { SearchProductItem } from "@/lib/api/search";
import { productPageSlug } from "@/lib/productUrl";

type ShopLike = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  owner_id?: string | null;
  whatsapp_number?: string | null;
  is_active?: boolean;
  category?: string | null;
  trust_score?: number | null;
  trust_badges?: string[];
  available_now?: boolean | null;
  location?: string | null;
};

export function shopIsVerified(shop: {
  is_active?: boolean | null;
  trust_badges?: string[] | null;
}): boolean {
  const badges = shop.trust_badges ?? [];
  if (badges.includes("identity_verified") || badges.includes("business_verified")) {
    return true;
  }
  return shop.is_active === true;
}

function ratingFromAverage(avg?: number | null): number | undefined {
  if (avg == null || avg <= 0) return undefined;
  return avg;
}

function anyVideoInUrls(urls: readonly (string | null | undefined)[] | null | undefined): boolean {
  if (!urls) return false;
  for (const u of urls) {
    if (u && isVideoUrl(u)) return true;
  }
  return false;
}

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
    hasVideo: anyVideoInUrls([p.primary_image]),
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
      verified: shopIsVerified(p.shop),
      category: p.shop.category ?? null,
      trust_score: p.shop.trust_score ?? null,
      available_now: p.shop.available_now ?? null,
      location: p.shop.location ?? null,
    },
    category: p.category ?? null,
    boosted: p.boosted,
    updated_at: p.updated_at ?? p.created_at ?? null,
    location_name: p.location_name ?? null,
    rating: ratingFromAverage(p.average_rating),
    reviewCount: p.review_count ?? 0,
    negotiable: p.is_negotiable !== false,
  };
}

export function searchItemToCard(item: SearchProductItem, site?: string): ProductCardData {
  const slug = productPageSlug(item);
  const origin = site ?? (typeof window !== "undefined" ? window.location.origin : "");
  return {
    id: item.id,
    slug,
    title: item.title,
    priceUGX: item.price_ugx,
    originalPriceUGX: item.price_ugx,
    discountPriceUGX: item.discount_price ?? null,
    discountPercent:
      item.discount_price != null && item.discount_price > 0 && item.discount_price < item.price_ugx
        ? Math.round((1 - item.discount_price / item.price_ugx) * 100)
        : 0,
    imageUrl: item.primary_image ?? item.image_urls?.[0] ?? undefined,
    hasVideo: anyVideoInUrls(item.image_urls ?? [item.primary_image]),
    shopLogoUrl: item.shop.logo_url ?? undefined,
    stockQuantity: null,
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
      verified: shopIsVerified(item.shop),
      category: item.shop.category ?? null,
      trust_score: item.shop.trust_score ?? null,
      available_now: item.shop.available_now ?? null,
      location: item.shop.location ?? null,
    },
    category: item.category ?? null,
    boosted: item.boosted,
    updated_at: item.updated_at ?? item.created_at ?? null,
    location_name: item.location_name ?? null,
    rating: ratingFromAverage(item.average_rating),
    reviewCount: item.review_count ?? 0,
    negotiable: item.is_negotiable !== false,
  };
}

export function productToCard(
  product: Product,
  shop: ShopLike,
  listingBase: string,
  opts?: { inShopContext?: boolean },
): ProductCardData {
  const slug = productPageSlug(product);
  return {
    id: product.id,
    slug,
    title: product.title,
    priceUGX: productPriceUgx(product),
    originalPriceUGX: productOriginalPriceUgx(product),
    discountPriceUGX: product.discount_price ?? null,
    discountPercent: productIsDiscounted(product) ? productDiscountPercent(product) : 0,
    imageUrl: productPrimaryImage(product),
    hasVideo: productImageUrls(product).some(isVideoUrl),
    shopLogoUrl: shop.logo_url ?? undefined,
    stockQuantity: product.stock_quantity ?? null,
    viewCount: product.view_count ?? undefined,
    likeCount: product.like_count ?? undefined,
    isLiked: product.viewer_liked ?? undefined,
    shopWhatsApp: shop.whatsapp_number ?? null,
    listingUrl: `${listingBase}/products/${slug}`,
    sellerId: shop.owner_id ?? null,
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      verified: shopIsVerified(shop),
      category: shop.category ?? null,
      trust_score: shop.trust_score ?? null,
      available_now: shop.available_now ?? null,
      location: shop.location ?? null,
    },
    category: product.category ?? null,
    description: product.description ?? null,
    inShopContext: opts?.inShopContext,
    updated_at: product.updated_at ?? product.created_at ?? null,
    location_name: product.location_name ?? null,
    rating: ratingFromAverage(product.average_rating),
    negotiable: product.is_negotiable !== false,
  };
}

export function similarProductToCard(p: SimilarProduct): ProductCardData {
  return {
    id: p.id,
    slug: productPageSlug(p),
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent:
      p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
        ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
        : 0,
    imageUrl: p.image_urls?.[0] ?? undefined,
    hasVideo: anyVideoInUrls(p.image_urls),
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
      verified: shopIsVerified({
        is_active: p.shop_is_active,
        trust_badges: p.shop_trust_badges,
      }),
      category: null,
      trust_score: null,
      available_now: p.shop_available_now ?? null,
      location: null,
    },
    boosted: false,
    updated_at: p.created_at ?? null,
    rating: ratingFromAverage(p.average_rating),
    reviewCount: p.review_count ?? 0,
    negotiable: p.is_negotiable !== false,
  };
}

export function likedProductToCard(p: LikedProduct): ProductCardData {
  return {
    id: p.id,
    slug: productPageSlug(p),
    title: p.title,
    priceUGX: p.price_ugx,
    originalPriceUGX: p.price_ugx,
    discountPriceUGX: p.discount_price ?? null,
    discountPercent:
      p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price_ugx
        ? Math.round((1 - p.discount_price / p.price_ugx) * 100)
        : 0,
    imageUrl: p.image_urls?.[0] ?? undefined,
    hasVideo: anyVideoInUrls(p.image_urls),
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
      verified: shopIsVerified({
        is_active: p.shop_is_active,
        trust_badges: p.shop_trust_badges,
      }),
      category: null,
      trust_score: null,
      available_now: p.shop_available_now ?? null,
      location: null,
    },
    boosted: false,
    updated_at: p.created_at ?? null,
    rating: ratingFromAverage(p.average_rating),
    reviewCount: p.review_count ?? 0,
    negotiable: p.is_negotiable !== false,
  };
}
