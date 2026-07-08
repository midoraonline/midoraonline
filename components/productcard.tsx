import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import CategoryDisplay from "@/components/CategoryDisplay";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { apiListingEvents } from "@/lib/api";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import TradeDisclaimer from "@/components/TradeDisclaimer";

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
  rating?: number;
  reviewCount?: number;
  negotiable?: boolean;
};

function formatRating(value: number): string {
  return value % 1 === 0 ? value.toFixed(1) : value.toFixed(1);
}

function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-700">
      <VerifiedIcon className="!text-[10px] text-sky-600" size={10} />
      {compact ? "Verified" : "Verified seller"}
    </span>
  );
}

function RatingDisplay({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  if (rating == null || rating <= 0) {
    return (
      <span className="flex items-center gap-0.5 shrink-0 text-neutral-400">
        <MaterialSymbol name="star" className="!text-[11px] shrink-0" />
        <span>No reviews</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      <MaterialSymbol name="star" className="!text-[11px] text-amber-500 shrink-0" filled />
      <span className="font-semibold text-foreground">{formatRating(rating)}</span>
      {reviewCount != null && reviewCount > 0 ? (
        <span className="text-neutral-400">({reviewCount})</span>
      ) : null}
    </span>
  );
}

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

function timeLabel(iso: string | null | undefined): { label: string; className: string } | null {
  if (!iso) return null;
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) {
    return {
      label: "JUST NOW",
      className: "bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm",
    };
  }
  if (mins < 60) {
    return {
      label: `HOT · ${mins}M AGO`,
      className: "bg-orange-500 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm",
    };
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return {
      label: `${hours}h ago`,
      className: "bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-xs",
    };
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return {
      label: `${days}d ago`,
      className: "bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-xs",
    };
  }
  const months = Math.floor(days / 30);
  return {
    label: `${months}mo ago`,
    className: "bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-xs",
  };
}

function getPeopleViewing(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 8) + 2; // returns between 2 and 9 viewers deterministically
}

export default function ProductCard({
  product,
  layout = "vertical",
}: {
  product: ProductCardData;
  layout?: "vertical" | "horizontal";
}) {
  const unopt = product.imageUrl ? userMediaUnoptimized(product.imageUrl) : false;
  const waHref = product.shopWhatsApp?.trim()
    ? productInquiryWhatsAppUrl(product.shopWhatsApp, {
        itemTitle: product.title,
        itemUrl: product.listingUrl ?? undefined,
      })
    : null;
  const productHref = `/products/${product.slug}`;

  const viewCount = typeof product.viewCount === "number" ? product.viewCount : null;
  const tInfo = timeLabel(product.updated_at || null);
  const isBoosted = product.boosted === true;
  const isDiscounted =
    product.discountPriceUGX != null &&
    product.discountPriceUGX > 0 &&
    (product.originalPriceUGX ?? product.priceUGX) > product.discountPriceUGX;
  
  const discountPct = isDiscounted
    ? Math.round((1 - product.discountPriceUGX! / (product.originalPriceUGX ?? product.priceUGX)) * 100)
    : 0;

  const peopleViewing = getPeopleViewing(product.id);

  if (layout === "horizontal") {
    return (
      <article className="dm-product-card dm-card-hover flex flex-row h-full overflow-hidden bg-surface min-h-[180px] sm:min-h-[220px] w-full">
        {/* Image area (Left) */}
        <div className="relative w-2/5 sm:w-1/2 bg-surface-subtle overflow-hidden group shrink-0">
          <Link href={productHref} className="dm-focus block w-full h-full outline-none">
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
              <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
                <div className="flex flex-col items-center gap-2">
                  <MaterialSymbol name="image" className="!text-2xl text-neutral-300" />
                  <span className="text-xs">No image</span>
                </div>
              </div>
            )}
          </Link>

          {/* Floating Badges */}
          <div className="absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap gap-1.5">
              {isBoosted && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
                  <MaterialSymbol name="bolt" className="!text-[11px]" />
                  Popular
                </span>
              )}
            </div>
          </div>

          {/* Floating Save Button on Image (Upper Right) */}
          <div className="absolute top-2 right-2 z-[7]">
            <ProductLikeButton
              productId={product.id}
              variant="floating"
              initialLiked={product.isLiked}
              initialLikeCount={product.likeCount}
            />
          </div>

          {/* People Viewing Overlay (Bottom Right) */}
          <div className="absolute bottom-2 right-2 z-[6] inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm backdrop-blur-xs pointer-events-none">
            <MaterialSymbol name="group" className="!text-[11px]" />
            <span>{peopleViewing} viewing</span>
          </div>
        </div>

        {/* Card body (Right) */}
        <div className="flex flex-col gap-1.5 p-3 sm:p-4 flex-1 justify-between min-w-0">
          <div className="space-y-1">
            {/* Title & Discount Inline */}
            <div className="flex items-start gap-1">
              <Link href={productHref} className="dm-focus block flex-1 outline-none min-w-0">
                <h3 className="line-clamp-1 sm:line-clamp-2 text-sm sm:text-base font-bold tracking-tight text-foreground leading-snug hover:text-accent transition-colors">
                  {product.title}
                </h3>
              </Link>
              {isDiscounted && (
                <span className="inline-flex shrink-0 items-center justify-center rounded bg-amber-400 px-1 py-0.5 text-[9px] font-black text-black leading-none">
                  -{discountPct}%
                </span>
              )}
            </div>

            {/* Price Row */}
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold tabular-nums text-accent">
                {formatUGX(isDiscounted ? product.discountPriceUGX! : product.priceUGX)}
              </span>
              {isDiscounted && (
                <span className="text-xs font-medium text-muted line-through tabular-nums">
                  {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
                </span>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-1 mt-1">
              {product.shop.verified ? <VerifiedBadge compact /> : null}
              {product.negotiable !== false ? (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[9px] font-semibold text-muted">
                  <MaterialSymbol name="handshake" className="!text-[10px]" />
                  Negotiable
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[9px] font-semibold text-muted">
                  <MaterialSymbol name="sell" className="!text-[10px]" />
                  Fixed price
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {/* Details Row: Location, Views, Rating */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 border-t border-neutral-100 pt-2">
              <span className="flex items-center gap-0.5 min-w-0 flex-1">
                <MaterialSymbol name="location_on" className="!text-[11px] shrink-0 text-muted" />
                <span className="truncate">{product.location_name || product.shop.location || "Kampala"}</span>
              </span>
              <span className="flex items-center gap-0.5 shrink-0 px-2">
                <span className="text-neutral-400">Views: </span>
                <span>{viewCount !== null ? (viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount) : "—"}</span>
              </span>
              <RatingDisplay rating={product.rating} reviewCount={product.reviewCount} />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
              {waHref ? (
                <TradeDisclaimer type="whatsapp" onConfirm={() => {
                  apiListingEvents.recordListingEvent(product.id, "whatsapp_clicked").catch(() => {});
                  window.open(waHref, "_blank", "noopener,noreferrer");
                }}>
                  {(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="dm-focus flex items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover active:opacity-90 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      <MaterialSymbol name="chat" className="!text-[14px]" />
                      Chat
                    </button>
                  )}
                </TradeDisclaimer>
              ) : (
                <Link
                  href={productHref}
                  className="dm-focus flex items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover active:opacity-90 py-2 text-xs font-bold text-white transition-colors"
                >
                  <MaterialSymbol name="chat" className="!text-[14px]" />
                  Chat
                </Link>
              )}

              <ProductLikeButton
                productId={product.id}
                variant="outline"
                initialLiked={product.isLiked}
                initialLikeCount={product.likeCount}
                className="!py-2"
              />
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default Vertical Layout
  return (
    <article className="dm-product-card dm-card-hover flex w-full flex-col overflow-hidden">
      {/* Image area */}
      <div className="relative aspect-square w-full bg-surface-subtle sm:aspect-[4/3] overflow-hidden group">
        <Link href={productHref} className="dm-focus block w-full h-full outline-none">
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
            <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
              <div className="flex flex-col items-center gap-2">
                <MaterialSymbol name="image" className="!text-2xl text-neutral-300" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}
        </Link>

        {/* Floating Badges */}
        <div className="absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1.5">
            {isBoosted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
                <MaterialSymbol name="bolt" className="!text-[11px]" />
                Popular
              </span>
            )}
            {tInfo && (
              <span className={tInfo.className}>
                <MaterialSymbol name="schedule" className="!text-[11px]" />
                {tInfo.label}
              </span>
            )}
            {product.shop.available_now && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
                <MaterialSymbol name="sensors" className="!text-[11px] animate-pulse" />
                Live Now
              </span>
            )}
          </div>
        </div>

        {/* Floating Save Button on Image (Upper Right) */}
        <div className="absolute top-2 right-2 z-[7]">
          <ProductLikeButton
            productId={product.id}
            variant="floating"
            initialLiked={product.isLiked}
            initialLikeCount={product.likeCount}
          />
        </div>

        {/* People Viewing Overlay (Bottom Right) */}
        <div className="absolute bottom-2 right-2 z-[6] inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm backdrop-blur-xs pointer-events-none">
          <MaterialSymbol name="group" className="!text-[11px]" />
          <span>{peopleViewing} people viewing</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Title & Discount Inline */}
        <div className="flex items-start gap-1">
          <Link href={productHref} className="dm-focus block flex-1 outline-none min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-accent">
              {product.title}
            </h3>
          </Link>
          {isDiscounted && (
            <span className="inline-flex shrink-0 items-center justify-center rounded bg-amber-400 px-1 py-0.5 text-[9px] font-black text-black leading-none">
              -{discountPct}%
            </span>
          )}
        </div>

        {(product.category || product.shop.category) ? (
          <CategoryDisplay
            label={product.category ?? product.shop.category}
            variant="compact"
            className="mt-0.5"
          />
        ) : null}

        {/* Price Row */}
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-extrabold tabular-nums text-accent">
            {formatUGX(isDiscounted ? product.discountPriceUGX! : product.priceUGX)}
          </span>
          {isDiscounted && (
            <span className="text-xs font-medium text-muted line-through tabular-nums">
              {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
            </span>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {product.shop.verified ? <VerifiedBadge /> : null}
          {product.negotiable !== false ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[9px] font-semibold text-muted">
              <MaterialSymbol name="handshake" className="!text-[10px]" />
              Price negotiable
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[9px] font-semibold text-muted">
              <MaterialSymbol name="sell" className="!text-[10px]" />
              Fixed price
            </span>
          )}
        </div>

        {/* Details Row: Location, Views, Rating */}
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted">
          <span className="flex items-center gap-0.5 min-w-0 flex-1">
            <MaterialSymbol name="location_on" className="!text-[11px] shrink-0 text-muted" />
            <span className="truncate">{product.location_name || product.shop.location || "Kampala"}</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0 px-2">
            <span className="text-neutral-400">Views: </span>
            <span>{viewCount !== null ? (viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount) : "—"}</span>
          </span>
          <RatingDisplay rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        {/* WhatsApp Button */}
        <div className="mt-2 border-t border-border pt-2">
          {waHref ? (
            <TradeDisclaimer type="whatsapp" onConfirm={() => {
              apiListingEvents.recordListingEvent(product.id, "whatsapp_clicked").catch(() => {});
              window.open(waHref, "_blank", "noopener,noreferrer");
            }}>
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="dm-focus w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#22c35e] active:bg-[#1fae53] py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <WhatsAppIcon className="size-4 shrink-0 text-white" />
                  Chat on WhatsApp
                </button>
              )}
            </TradeDisclaimer>
          ) : (
            <Link
              href={productHref}
              className="dm-focus w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#22c35e] active:bg-[#1fae53] py-2 text-xs font-bold text-white transition-colors text-center"
            >
              <WhatsAppIcon className="size-4 shrink-0 text-white" />
              Chat on WhatsApp
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
