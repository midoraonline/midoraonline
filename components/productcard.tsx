import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { apiListingEvents } from "@/lib/api";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
      <article className="dm-card dm-card-hover flex flex-row h-full overflow-hidden bg-white shadow-xs border border-neutral-100 rounded-2xl min-h-[180px] sm:min-h-[220px] w-full">
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
                <h3 className="line-clamp-1 sm:line-clamp-2 text-sm sm:text-base font-bold tracking-tight text-neutral-900 leading-snug hover:text-orange-600 transition-colors">
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
              <span className="text-base sm:text-lg font-extrabold tabular-nums text-orange-600">
                {formatUGX(isDiscounted ? product.discountPriceUGX! : product.priceUGX)}
              </span>
              {isDiscounted && (
                <span className="text-xs font-medium text-neutral-400 line-through tabular-nums">
                  {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
                </span>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-1 mt-1">
              {product.shop.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-100">
                  <MaterialSymbol name="verified" className="!text-[10px] text-emerald-600" filled />
                  Verified
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 rounded-full bg-neutral-50 px-2 py-0.5 text-[9px] font-semibold text-neutral-600 border border-neutral-200">
                <MaterialSymbol name="handshake" className="!text-[10px] text-neutral-500" />
                Negotiable
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Details Row: Location, Views, Rating */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 border-t border-neutral-100 pt-2">
              <span className="flex items-center gap-0.5 min-w-0 flex-1">
                <MaterialSymbol name="location_on" className="!text-[11px] text-neutral-400 shrink-0" />
                <span className="truncate">{product.location_name || product.shop.location || "Kampala"}</span>
              </span>
              <span className="flex items-center gap-0.5 shrink-0 px-2">
                <MaterialSymbol name="visibility" className="!text-[11px] text-neutral-400 shrink-0" />
                <span>{viewCount !== null ? (viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount) : "12"}</span>
              </span>
              <span className="flex items-center gap-0.5 shrink-0">
                <MaterialSymbol name="star" className="!text-[11px] text-amber-500 shrink-0" filled />
                <span className="font-semibold text-neutral-800">{product.rating || "4.5"}</span>
              </span>
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
                      className="dm-focus flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      <MaterialSymbol name="chat" className="!text-[14px]" />
                      Chat
                    </button>
                  )}
                </TradeDisclaimer>
              ) : (
                <Link
                  href={productHref}
                  className="dm-focus flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 py-2 text-xs font-bold text-white transition-colors"
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
    <article className="dm-card dm-card-hover flex flex-col overflow-hidden bg-white shadow-xs border border-neutral-100 rounded-2xl w-full">
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
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-neutral-900 leading-snug hover:text-orange-600 transition-colors">
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
          <span className="text-base font-extrabold tabular-nums text-orange-600">
            {formatUGX(isDiscounted ? product.discountPriceUGX! : product.priceUGX)}
          </span>
          {isDiscounted && (
            <span className="text-xs font-medium text-neutral-400 line-through tabular-nums">
              {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
            </span>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {product.shop.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-100">
              <MaterialSymbol name="verified" className="!text-[10px] text-emerald-600" filled />
              Verified seller
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-0.5 text-[9px] font-semibold text-neutral-600 border border-neutral-200">
            <MaterialSymbol name="handshake" className="!text-[10px] text-neutral-500" />
            Price negotiable
          </span>
        </div>

        {/* Details Row: Location, Views, Rating */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1 border-t border-neutral-100 pt-2 pb-1">
          <span className="flex items-center gap-0.5 min-w-0 flex-1">
            <MaterialSymbol name="location_on" className="!text-[11px] text-neutral-400 shrink-0" />
            <span className="truncate">{product.location_name || product.shop.location || "Kampala"}</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0 px-2">
            <MaterialSymbol name="visibility" className="!text-[11px] text-neutral-400 shrink-0" />
            <span>{viewCount !== null ? (viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount) : "12"} views</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <MaterialSymbol name="star" className="!text-[11px] text-amber-500 shrink-0" filled />
            <span className="font-semibold text-neutral-800">{product.rating || "4.5"}</span>
            <span className="text-neutral-400">({product.likeCount || 12})</span>
          </span>
        </div>

        {/* WhatsApp Button */}
        <div className="mt-2 pt-1 border-t border-neutral-100">
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
