import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductWhatsAppButton from "@/components/product/ProductWhatsAppButton";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import StarRating from "@/components/StarRating";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  originalPriceUGX?: number;
  discountPriceUGX?: number | null;
  discountPercent?: number;
  imageUrl?: string;
  shopLogoUrl?: string;
  stockQuantity?: number | null;
  viewCount?: number;
  shopWhatsApp?: string | null;
  listingUrl?: string | null;
  sellerId?: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    verified?: boolean;
    category?: string | null;
    trust_score?: number | null;
    available_now?: boolean | null;
    location?: string | null;
  };
  category?: string | null;
  description?: string | null;
  inShopContext?: boolean;
  boosted?: boolean;
  updated_at?: string | null;
  location_name?: string | null;
  likeCount?: number;
  isLiked?: boolean;
};

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function userMediaUnoptimized(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const unopt = product.imageUrl ? userMediaUnoptimized(product.imageUrl) : false;
  const waHref = product.shopWhatsApp?.trim()
    ? productInquiryWhatsAppUrl(product.shopWhatsApp, {
        itemTitle: product.title,
        itemUrl: product.listingUrl ?? undefined,
      })
    : null;
  const inShop = product.inShopContext === true;
  const desc = product.description?.trim() ?? "";
  const productHref = `/products/${product.slug}`;

  const viewCount =
    typeof product.viewCount === "number" ? product.viewCount : null;
  const freshness = timeAgo(product.updated_at || null);
  const isBoosted = product.boosted === true;
  const isAvailable =
    product.shop.available_now !== false &&
    (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity > 0);
  const trustScore = product.shop.trust_score ?? null;
  const isDiscounted = product.discountPriceUGX != null && product.discountPriceUGX > 0 && (product.originalPriceUGX ?? product.priceUGX) > product.discountPriceUGX;
  const discountPct = isDiscounted ? Math.round((1 - product.discountPriceUGX! / (product.originalPriceUGX ?? product.priceUGX)) * 100) : 0;

  return (
    <article className="dm-card dm-card-hover flex flex-col overflow-hidden">
      {/* Image area */}
      <Link href={productHref} className="dm-focus group block outline-none">
        <div className="relative aspect-square w-full bg-surface-subtle sm:aspect-[4/3]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={unopt}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted">
              <div className="flex flex-col items-center gap-2">
                <MaterialSymbol name="image" className="!text-2xl text-muted/40" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {isBoosted && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                  <MaterialSymbol name="bolt" className="!text-[11px]" />
                  Boosted
                </span>
              )}
              {isDiscounted && (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                  <MaterialSymbol name="sell" className="!text-[11px]" />
                  -{discountPct}%
                </span>
              )}
              {freshness && (
                <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                  {freshness}
                </span>
              )}
            </div>
          </div>

          {viewCount !== null && (
            <div className="absolute bottom-2 right-2 z-[6] inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              <MaterialSymbol name="visibility" className="!text-[11px]" />
              {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
            </div>
          )}

          {/* Hover overlay */}
          {!inShop ? (
            <div
              className="pointer-events-none absolute inset-0 z-[5] flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/35 to-transparent opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover:opacity-100"
              aria-hidden
            >
              <div className="space-y-1.5 px-4 pb-4">
                <p className="text-xs text-white/85">
                  {product.shop.name}
                  {product.shop.verified ? " · Verified" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-foreground/50 px-2 py-0.5 text-[10px] font-medium text-white/80">
                      Unavailable
                    </span>
                  )}
                  {product.location_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      <MaterialSymbol name="location_on" className="!text-[9px]" />
                      {product.location_name}
                    </span>
                  )}
                  {trustScore !== null && trustScore > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      ★ {trustScore.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {inShop && desc ? (
            <div
              className="pointer-events-none absolute inset-0 z-[6] flex items-end bg-gradient-to-t from-black/80 via-black/45 to-transparent opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover:opacity-100"
              aria-hidden
            >
              <p className="line-clamp-4 max-h-[50%] overflow-hidden px-4 pb-4 pt-10 text-left text-xs leading-relaxed text-white drop-shadow-md sm:text-sm">
                {desc}
              </p>
            </div>
          ) : null}
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2.5">
        <Link href={productHref} className="dm-focus block outline-none">
          <p className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
            {product.title}
          </p>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <Link
            href={productHref}
            className="dm-focus min-w-0 truncate"
          >
            {isDiscounted ? (
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-bold tabular-nums text-accent">
                  {formatUGX(product.discountPriceUGX!)}
                </span>
                <span className="text-[11px] font-medium text-muted line-through">
                  {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
                </span>
              </span>
            ) : (
              <span className="text-sm font-bold tabular-nums text-accent">
                {formatUGX(product.priceUGX)}
              </span>
            )}
          </Link>

          <ProductLikeButton
            productId={product.id}
            size="compact"
            className="shrink-0"
            initialLiked={product.isLiked}
            initialLikeCount={product.likeCount}
          />
        </div>

        {/* Rating */}
        <div>
        </div>

        {/* WhatsApp button */}
        {waHref && (
          <div className="flex items-center pt-0.5">
            <ProductWhatsAppButton
              waHref={waHref}
              productId={product.id}
              className="w-full rounded-xl py-2"
            />
          </div>
        )}
      </div>
    </article>
  );
}
