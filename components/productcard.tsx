"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, MapPin, Play, Star, Zap } from "lucide-react";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import { isVideoUrl } from "@/lib/api/products";
import FallbackImage from "@/components/media/FallbackImage";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { track } from "@/lib/analytics";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { useImpressionTracker, type ImpressionPool } from "@/lib/hooks/useImpressionTracker";
import { formatLastActive, formatMemberSince } from "@/lib/trustSignals";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import TradeDisclaimer from "@/components/TradeDisclaimer";
import {
  resolveShopTrustLevel,
  SHOP_TRUST_LABEL,
} from "@/lib/productCardMap";
import {
  COMPENSATION_OPTIONS,
  LISTING_KIND_LABEL,
  listingCardLabel,
  normalizeListingKind,
  parseListingMeta,
  textListingChips,
  type ListingMeta,
} from "@/lib/listingMeta";
import { isOnlineLocation } from "@/lib/listingLocation";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  originalPriceUGX?: number;
  discountPriceUGX?: number | null;
  discountPercent?: number;
  imageUrl?: string;
  /** Every media URL, cover first, so a dead file can fall through. */
  imageUrls?: string[];
  /** True when any media attached to the listing is a video URL. */
  hasVideo?: boolean;
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
    trust_badges?: string[];
    category?: string | null;
    trust_score?: number | null;
    available_now?: boolean | null;
    location?: string | null;
    lat?: number | null;
    lng?: number | null;
    is_personal?: boolean;
    seller_name?: string | null;
    joined_at?: string | null;
    last_active_at?: string | null;
  };
  category?: string | null;
  description?: string | null;
  inShopContext?: boolean;
  boosted?: boolean;
  updated_at?: string | null;
  location_name?: string | null;
  /** product | service | opportunity (job maps to opportunity) */
  item_type?: string | null;
  likeCount?: number;
  isLiked?: boolean;
  rating?: number;
  reviewCount?: number;
  negotiable?: boolean;
  listing_meta?: Record<string, unknown> | null;
};

function PersonalSellerLine({ shop }: { shop: ProductCardData["shop"] }) {
  if (!shop.is_personal) return null;
  const name = shop.seller_name?.trim() || shop.name;
  const joined = formatMemberSince(shop.joined_at);
  const active = formatLastActive(shop.last_active_at);
  return (
    <p className="truncate text-[11px] leading-snug text-muted">
      <span className="font-medium text-foreground/80">{name}</span>
      {joined ? <span> · Joined {joined}</span> : null}
      {active ? <span> · {active}</span> : null}
    </p>
  );
}

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

function formatListingRate(
  price: number,
  kind: "service" | "opportunity",
  meta: ListingMeta,
): string {
  if (kind === "service" && meta.pricing_model === "quote") return "Get a quote";
  if (price <= 0) {
    if (kind === "opportunity") {
      return optionLabel(COMPENSATION_OPTIONS, meta.compensation) ?? "See details";
    }
    return "Get a quote";
  }
  const base = formatUGX(price);
  if (kind === "service") {
    if (meta.pricing_model === "hourly") return `${base}/hr`;
    if (meta.pricing_model === "starting_at") return `From ${base}`;
  }
  return base;
}

function coverMediaUrls(product: ProductCardData): string[] {
  const listed = (product.imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  if (listed.length) return listed;
  const single = product.imageUrl?.trim();
  return single ? [single] : [];
}

function CoverPlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-surface-subtle text-muted">
      <ImageIcon className="size-8 opacity-40" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

function ListingCover({
  urls,
  title,
  sizes,
  onExhausted,
}: {
  urls: string[];
  title: string;
  sizes: string;
  onExhausted: () => void;
}) {
  const images = urls.filter((url) => !isVideoUrl(url));
  const video = urls.find((url) => isVideoUrl(url));
  return (
    <FallbackImage
      urls={images}
      alt={title}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      onExhausted={video ? undefined : onExhausted}
      fallback={
        video ? (
          <video
            src={video}
            className="absolute inset-0 h-full w-full object-cover bg-surface-subtle"
            muted
            playsInline
            preload="metadata"
            aria-label={title}
            onError={onExhausted}
          />
        ) : (
          <CoverPlaceholder />
        )
      }
    />
  );
}

/** Freshness / trust cue from listing time. */
function timeLabel(iso: string | null | undefined): {
  label: string;
  tone: "hot" | "fresh" | "muted";
} | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return { label: "Just now", tone: "hot" };
  if (mins < 60) return { label: `Hot · ${mins}m`, tone: "hot" };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `${hours}h ago`, tone: "fresh" };
  const days = Math.floor(hours / 24);
  if (days < 30) return { label: `${days}d ago`, tone: "muted" };
  const months = Math.floor(days / 30);
  return { label: `${months}mo ago`, tone: "muted" };
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function WhatsAppCta({
  waHref,
  productId,
  productHref,
  shopId,
  category,
  hasDiscount,
  compact = false,
}: {
  waHref: string | null;
  productId: string;
  productHref: string;
  shopId?: string;
  category?: string;
  hasDiscount?: boolean;
  compact?: boolean;
}) {
  const className = `dm-focus flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-bold text-white transition-colors hover:bg-[#22c35e] active:bg-[#1fae53] ${
    compact ? "py-2" : "py-2.5"
  }`;

  const inner = (
    <>
      <WhatsAppIcon className="size-3.5 shrink-0 text-white sm:size-4" />
      WhatsApp
    </>
  );

  if (waHref) {
    return (
      <TradeDisclaimer
        type="whatsapp"
        onConfirm={() => {
          if (shopId) {
            track("conversion:whatsapp_click", {
              productId,
              shopId,
              category,
              hasDiscount,
              clickSource: "search_result",
            });
          }
          notifyFeedEngagement();
          window.open(waHref, "_blank", "noopener,noreferrer");
        }}
      >
        {(open) => (
          <button type="button" onClick={open} className={`${className} cursor-pointer`}>
            {inner}
          </button>
        )}
      </TradeDisclaimer>
    );
  }

  return (
    <Link href={productHref} className={className}>
      {inner}
    </Link>
  );
}

export default function ProductCard({
  product,
  layout = "vertical",
  impressionPool,
  impressionPosition,
}: {
  product: ProductCardData;
  layout?: "vertical" | "horizontal";
  impressionPool?: ImpressionPool;
  impressionPosition?: number;
}) {
  const impressionRef = useImpressionTracker<HTMLElement>({
    listingId: product.id,
    shopId: product.shop.id,
    pool: impressionPool ?? (product.boosted ? "boosted" : "organic"),
    position: impressionPosition,
  });

  const waHref = product.shopWhatsApp?.trim()
    ? productInquiryWhatsAppUrl(product.shopWhatsApp, {
        itemTitle: product.title,
        itemUrl: product.listingUrl ?? undefined,
      })
    : null;
  const productHref = `/products/${product.slug}`;
  const tInfo = timeLabel(product.updated_at || null);
  const isBoosted = product.boosted === true;
  const shopLive = product.shop.available_now === true;
  const locationRaw =
    product.location_name?.trim() || product.shop.location?.trim() || null;
  const locationOnline = isOnlineLocation(locationRaw);
  const locationLabel = locationOnline ? "Online" : locationRaw ?? "Uganda";

  const isDiscounted =
    product.discountPriceUGX != null &&
    product.discountPriceUGX > 0 &&
    (product.originalPriceUGX ?? product.priceUGX) > product.discountPriceUGX;
  const discountPct = isDiscounted
    ? Math.round(
        (1 - product.discountPriceUGX! / (product.originalPriceUGX ?? product.priceUGX)) *
          100,
      )
    : 0;
  const price = isDiscounted ? product.discountPriceUGX! : product.priceUGX;
  const trustLevel = resolveShopTrustLevel(product.shop.trust_badges);
  const ratingValue = product.rating ?? 0;
  const listingKind = normalizeListingKind(product.item_type);
  const showKindBadge = listingKind !== "product";
  const coverUrls = coverMediaUrls(product);
  const [trackedId, setTrackedId] = useState(product.id);
  const [coverFailed, setCoverFailed] = useState(false);
  if (trackedId !== product.id) {
    setTrackedId(product.id);
    setCoverFailed(false);
  }
  const hasMedia = coverUrls.length > 0;
  const textFirst = listingKind !== "product" && (!hasMedia || coverFailed);
  const coverFrame = (sizes: string) =>
    coverFailed || coverUrls.length === 0 ? (
      <CoverPlaceholder />
    ) : (
      <ListingCover
        urls={coverUrls}
        title={product.title}
        sizes={sizes}
        onExhausted={() => setCoverFailed(true)}
      />
    );

  const imageBadges = (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2">
      <div className="flex max-w-[75%] flex-wrap gap-1">
        {showKindBadge && (
          <Badge className="bg-white/90 text-foreground">
            {LISTING_KIND_LABEL[listingKind]}
          </Badge>
        )}
        {isBoosted && (
          <Badge className="bg-accent text-white">
            <Zap className="size-2.5" strokeWidth={2.5} aria-hidden />
            Hot
          </Badge>
        )}
        {shopLive && (
          <Badge className="bg-emerald-600 text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
            Live now
          </Badge>
        )}
        {tInfo && (
          <Badge
            className={
              tInfo.tone === "hot"
                ? "bg-accent text-white"
                : tInfo.tone === "fresh"
                  ? "bg-primary/80 text-primary-foreground backdrop-blur-sm"
                  : "bg-black/55 text-white backdrop-blur-sm"
            }
          >
            {tInfo.label}
          </Badge>
        )}
        {isDiscounted && (
          <Badge className="bg-amber-400 text-primary">-{discountPct}%</Badge>
        )}
      </div>
    </div>
  );

  const likeFloating = (
    <div className="absolute top-2 right-2 z-[7]">
      <ProductLikeButton
        productId={product.id}
        variant="floating"
        initialLiked={product.isLiked}
        initialLikeCount={product.likeCount}
      />
    </div>
  );

  const videoBadge = product.hasVideo ? (
    <span
      className="pointer-events-none absolute bottom-2 left-2 z-[6] inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
      title="Video available"
    >
      <Play className="size-2.5 fill-current" aria-hidden />
      Video
    </span>
  ) : null;

  const trustLabel =
    trustLevel === "identity" ? "Identity verified" : SHOP_TRUST_LABEL[trustLevel];
  const trustMark =
    trustLevel === "registered" ? null : (
      <span title={trustLabel} className="inline-flex shrink-0">
        <VerifiedIcon
          className={
            trustLevel === "business"
              ? "!text-[13px] text-accent"
              : "!text-[13px] text-sky-600"
          }
          size={13}
          label={trustLabel}
        />
      </span>
    );

  const metaRow = (
    <div className="flex items-center gap-1.5 text-[10px] text-muted sm:text-[11px]">
      <span className="inline-flex min-w-0 flex-1 items-center gap-0.5">
        {locationOnline ? null : (
          <MapPin className="size-3 shrink-0 text-accent" strokeWidth={2} aria-hidden />
        )}
        <span className="truncate font-medium text-foreground/80">{locationLabel}</span>
      </span>
      {listingKind === "product" || textFirst ? trustMark : null}
      <span className="inline-flex shrink-0 items-center gap-0.5">
        <Star
          className={`size-3 ${ratingValue > 0 ? "fill-amber-400 text-amber-400" : "text-muted"}`}
          aria-hidden
        />
        <span
          className={`font-semibold tabular-nums ${
            ratingValue > 0 ? "text-foreground" : "text-muted"
          }`}
        >
          {ratingValue.toFixed(1)}
        </span>
      </span>
    </div>
  );

  if (textFirst) {
    const meta = parseListingMeta(product.listing_meta);
    const rate = formatListingRate(price, listingKind, meta);
    const chips = textListingChips(listingKind, meta);
    const description = product.description?.trim() || "";
    return (
      <article
        ref={impressionRef as React.RefObject<HTMLElement>}
        className="dm-product-card dm-card-hover flex h-full w-full flex-col overflow-hidden"
      >
        <div className="flex h-full min-h-0 flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {listingCardLabel(listingKind, meta, product.category)}
            </p>
            <ProductLikeButton
              productId={product.id}
              variant="floating"
              initialLiked={product.isLiked}
              initialLikeCount={product.likeCount}
            />
          </div>
          <Link href={productHref} className="dm-focus block outline-none">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-sm">
              {product.title}
            </h3>
          </Link>
          <PersonalSellerLine shop={product.shop} />
          {isBoosted || shopLive || isDiscounted ? (
            <div className="flex flex-wrap gap-1">
              {isBoosted ? <Badge className="bg-accent text-white">Hot</Badge> : null}
              {shopLive ? <Badge className="bg-emerald-600 text-white">Live now</Badge> : null}
              {isDiscounted ? (
                <Badge className="bg-amber-400 text-primary">-{discountPct}%</Badge>
              ) : null}
            </div>
          ) : null}
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    chip === "Urgent"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "border-border bg-surface-subtle text-foreground/80"
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[15px] font-extrabold tabular-nums text-accent sm:text-base">
              {rate}
            </span>
            {price > 0 && product.negotiable !== false ? (
              <span className="text-[10px] font-medium text-muted">· Negotiable</span>
            ) : null}
          </div>
          {description ? (
            <p className="line-clamp-3 flex-1 text-[11px] leading-snug text-muted sm:text-xs">
              {description}
            </p>
          ) : null}
          <div className={`${description ? "" : "mt-auto "}space-y-1.5`}>
            {metaRow}
            <WhatsAppCta
              waHref={waHref}
              productId={product.id}
              productHref={productHref}
              shopId={product.shop.id}
              category={product.category ?? undefined}
              hasDiscount={isDiscounted}
            />
          </div>
        </div>
      </article>
    );
  }

  if (layout === "horizontal") {
    return (
      <article
        ref={impressionRef as React.RefObject<HTMLElement>}
        className="dm-product-card dm-card-hover flex h-full min-h-[160px] w-full flex-row overflow-hidden bg-surface sm:min-h-[200px]"
      >
        <div className="group relative w-2/5 shrink-0 overflow-hidden bg-surface-subtle sm:w-[42%]">
          <Link href={productHref} className="dm-focus relative block h-full w-full outline-none">
            {coverFrame("(max-width: 640px) 40vw, 25vw")}
          </Link>
          {imageBadges}
          {likeFloating}
          {videoBadge}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
          <div className="space-y-1.5">
            <Link href={productHref} className="dm-focus block outline-none">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-[15px]">
                {product.title}
              </h3>
            </Link>
            <PersonalSellerLine shop={product.shop} />
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-extrabold tabular-nums text-accent sm:text-lg">
                {formatUGX(price)}
              </span>
              {isDiscounted && (
                <span className="text-xs font-medium text-muted line-through tabular-nums">
                  {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
                </span>
              )}
              {product.negotiable !== false && (
                <span className="text-[10px] font-medium text-muted">· Negotiable</span>
              )}
            </div>
            {metaRow}
          </div>
          <WhatsAppCta
            waHref={waHref}
            productId={product.id}
            productHref={productHref}
            shopId={product.shop.id}
            category={product.category ?? undefined}
            hasDiscount={isDiscounted}
            compact
          />
        </div>
      </article>
    );
  }

  return (
    <article
      ref={impressionRef as React.RefObject<HTMLElement>}
      className="dm-product-card dm-card-hover flex w-full flex-col overflow-hidden"
    >
      <div className="group relative aspect-square w-full overflow-hidden bg-surface-subtle sm:aspect-[4/3]">
        <Link href={productHref} className="dm-focus relative block h-full w-full outline-none">
          {coverFrame("(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw")}
        </Link>
        {imageBadges}
        {likeFloating}
        {videoBadge}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <Link href={productHref} className="dm-focus block outline-none">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-sm">
            {product.title}
          </h3>
        </Link>
        <PersonalSellerLine shop={product.shop} />

        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[15px] font-extrabold tabular-nums text-accent sm:text-base">
            {formatUGX(price)}
          </span>
          {isDiscounted && (
            <span className="text-[11px] font-medium text-muted line-through tabular-nums">
              {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
            </span>
          )}
          {product.negotiable !== false && (
            <span className="text-[10px] font-medium text-muted">· Negotiable</span>
          )}
        </div>

        {listingKind !== "product" ? trustMark : null}
        {metaRow}

        <div className="mt-auto pt-1.5">
          <WhatsAppCta
            waHref={waHref}
            productId={product.id}
            productHref={productHref}
            shopId={product.shop.id}
            category={product.category ?? undefined}
            hasDiscount={isDiscounted}
          />
        </div>
      </div>
    </article>
  );
}
