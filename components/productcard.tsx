"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ImageIcon, MapPin, Play, Repeat2, Star } from "lucide-react";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import { isVideoUrl, type CardIntentFields, type CardStatus, type FeedPlacement } from "@/lib/api/products";
import FallbackImage from "@/components/media/FallbackImage";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { useImpressionTracker } from "@/lib/hooks/useImpressionTracker";
import { formatLastActive, formatMemberSince } from "@/lib/trustSignals";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import BrandedCover, { type CoverTone } from "@/components/BrandedCover";
import CardCta from "@/components/card/CardCta";
import CardStatusBadge, { hasVisibleStatus } from "@/components/card/CardStatusBadge";
import { cardCategoryLabel, cardVisual, readCardIntent, safeApplicationLink } from "@/lib/cardIntent";
import {
  resolveShopTrustLevel,
  SHOP_TRUST_LABEL,
} from "@/lib/productCardMap";
import {
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  isTextOnlyListing,
  normalizeListingKind,
  parseListingMeta,
  deadlineChip,
  type ListingMeta,
} from "@/lib/listingMeta";
import { isOnlineLocation } from "@/lib/listingLocation";
import { PERSONAL_SELLER_LABEL } from "@/lib/shop/realShops";


const INTENT_ACCENT: Record<CoverTone, string> = {
  service: "text-listing-service-accent",
  opportunity: "text-listing-opportunity-accent",
};

/** Server intent fields (intent, opportunity_category, intent_label, cta) ride along; see lib/cardIntent.ts. */
export type ProductCardData = CardIntentFields & {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  originalPriceUGX?: number;
  discountPriceUGX?: number | null;
  discountPercent?: number;
  imageUrl?: string;
  imageUrls?: string[];
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
  placement?: FeedPlacement;
  /** Why a card outside the buyer's area is still relevant, e.g. "Delivers to Kampala". */
  locationReason?: string | null;
  status?: CardStatus | null;
  /** Reposted by the seller in the last 24 hours. */
  reposted?: boolean;
  updated_at?: string | null;
  location_name?: string | null;
  /** product | service | opportunity (job maps to opportunity) */
  item_type?: string | null;
  likeCount?: number;
  isLiked?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  negotiable?: boolean;
  listing_meta?: Record<string, unknown> | null;
};

function PersonalSellerLine({ shop, size }: { shop: ProductCardData["shop"]; size: string }) {
  if (!shop.is_personal) return null;
  const name = shop.seller_name?.trim() || shop.name;
  const joined = formatMemberSince(shop.joined_at);
  const active = formatLastActive(shop.last_active_at);
  return (
    <p className={`truncate leading-snug text-muted ${size}`}>
      <span className="font-medium text-foreground/80">{name}</span>
      <span> · {PERSONAL_SELLER_LABEL}</span>
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

/** Text-only slots stay content-height; photo cards still stretch with the row. */
export function productCardSlotClass(
  product: Pick<ProductCardData, "item_type" | "imageUrl" | "imageUrls">,
): string {
  const listed = (product.imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const count = listed.length || (product.imageUrl?.trim() ? 1 : 0);
  const width = "w-full min-w-0 max-w-full justify-self-stretch";
  const textOnly = isTextOnlyListing(product.item_type, count);
  return `${width} h-full${textOnly ? " self-stretch" : ""}`;
}

function coverMediaUrls(product: ProductCardData): string[] {
  const listed = (product.imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  if (listed.length) return listed;
  const single = product.imageUrl?.trim();
  return single ? [single] : [];
}

function CardRating({
  rating,
  count,
}: {
  rating?: number | null;
  count?: number | null;
}) {
  if (rating == null || !(rating > 0)) return null;
  const score = Math.min(5, rating).toFixed(1);
  const reviews = count != null && count > 0 ? ` (${count})` : "";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-medium tabular-nums text-foreground/80"
      aria-label={`Rated ${score} out of 5${count && count > 0 ? `, ${count} reviews` : ""}`}
    >
      <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
      <span>
        {score}
        {reviews}
      </span>
    </span>
  );
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
  priority,
  onExhausted,
}: {
  urls: string[];
  title: string;
  sizes: string;
  priority?: boolean;
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
      priority={priority}
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

function timeLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ShopLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) return null;
  return (
    <span className="pointer-events-none absolute bottom-2 left-2 z-[6] grid size-10 place-items-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white sm:size-11">
      <FallbackImage
        urls={[logoUrl]}
        alt={`${name} logo`}
        fill
        sizes="44px"
        className="object-cover"
        onExhausted={() => setFailed(true)}
      />
    </span>
  );
}

export default function ProductCard({
  product,
  layout = "vertical",
  impressionPosition,
  imagePriority = false,
}: {
  product: ProductCardData;
  layout?: "vertical" | "horizontal";
  impressionPosition?: number;
  imagePriority?: boolean;
}) {
  const impressionRef = useImpressionTracker<HTMLElement>({
    listingId: product.id,
    shopId: product.shop.id,
    pool: product.placement ?? "organic",
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
  const locationRaw =
    product.location_name?.trim() || product.shop.location?.trim() || null;
  const locationOnline = isOnlineLocation(locationRaw);
  const locationLabel = locationOnline ? "Online" : locationRaw ?? "Uganda";

  const isDiscounted =
    product.discountPriceUGX != null &&
    product.discountPriceUGX > 0 &&
    (product.originalPriceUGX ?? product.priceUGX) > product.discountPriceUGX;
  const price = isDiscounted ? product.discountPriceUGX! : product.priceUGX;
  const trustLevel = resolveShopTrustLevel(product.shop.trust_badges);
  const listingMeta = parseListingMeta(product.listing_meta);
  const listingKind = normalizeListingKind(product.item_type);
  const isListing = listingKind !== "product";
  const intent = readCardIntent(product);
  const tone: CoverTone = listingKind === "service" ? "service" : "opportunity";
  const displayPrice =
    listingKind === "product"
      ? formatUGX(price)
      : formatListingRate(price, listingKind, listingMeta);
  const isBudget =
    isListing && intent.intent === "seeking" && price > 0 && listingMeta.pricing_model !== "quote";
  const titleClass =
    listingKind === "product"
      ? "line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-sm"
      : "line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-base";
  const coverUrls = coverMediaUrls(product);
  const [trackedId, setTrackedId] = useState(product.id);
  const [coverFailed, setCoverFailed] = useState(false);
  if (trackedId !== product.id) {
    setTrackedId(product.id);
    setCoverFailed(false);
  }
  const hasMedia = coverUrls.length > 0;
  const textFirst = isListing && (!hasMedia || coverFailed);

  const repostedMark = product.reposted ? (
    <span
      role="img"
      aria-label="Reposted in the last 24 hours"
      title="Reposted today"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm"
    >
      <Repeat2 className="size-3.5" aria-hidden />
    </span>
  ) : null;
  const badgeRow =
    hasVisibleStatus(product.status) || repostedMark ? (
      <>
        <CardStatusBadge status={product.status} />
        {repostedMark}
      </>
    ) : null;

  const coverFrame = (sizes: string) =>
    textFirst ? (
      <BrandedCover
        tone={tone}
        title={product.title}
        intentLabel={intent.label}
        badge={badgeRow}
        visual={cardVisual(product.item_type, intent.opportunityCategory)}
        layout={layout}
      />
    ) : coverFailed || coverUrls.length === 0 ? (
      <CoverPlaceholder />
    ) : (
      <ListingCover
        urls={coverUrls}
        title={product.title}
        sizes={sizes}
        priority={imagePriority}
        onExhausted={() => setCoverFailed(true)}
      />
    );

  const imageBadges =
    badgeRow && !textFirst ? (
      <div className="pointer-events-none absolute left-2 top-2 z-[6] flex max-w-[75%] items-center gap-1">
        {badgeRow}
      </div>
    ) : null;

  const likeFloating = (
    <div className="absolute top-2 right-2 z-[7]">
      <ProductLikeButton
        productId={product.id}
        shopId={product.shop.id}
        category={product.category ?? undefined}
        variant="floating"
        initialLiked={product.isLiked}
        initialLikeCount={product.likeCount}
      />
    </div>
  );

  const videoBadge = product.hasVideo ? (
    <span
      className="pointer-events-none absolute bottom-2 right-2 z-[6] inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
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

  const whenLabel = deadlineChip(listingMeta.deadline) ?? tInfo;
  // Under 24 h left: warn in the body even when Sponsored holds the badge slot.
  const deadlineUrgent = whenLabel === "Closes today" || product.status === "closes_today";
  const conditionLabel =
    listingKind === "product" ? optionLabel(CONDITION_OPTIONS, listingMeta.condition) : null;
  const serviceArea =
    listingKind === "service" ? listingMeta.service_area?.trim() || null : null;
  const placeText = product.locationReason
    ? product.locationReason
    : serviceArea
      ? `Serves ${serviceArea}`
      : conditionLabel
        ? `${conditionLabel} · ${locationLabel}`
        : locationLabel;

  const sellerSize = isListing ? "text-[13px] sm:text-sm" : "text-[11px] sm:text-xs";
  const shopRow = product.shop.is_personal ? (
    <PersonalSellerLine shop={product.shop} size={sellerSize} />
  ) : (
    <div className={`flex min-w-0 items-center gap-1 text-muted ${sellerSize}`}>
      <span className="truncate font-medium">{product.shop.name}</span>
      {trustMark}
    </div>
  );

  const rating =
    product.rating != null && product.rating > 0 ? (
      <div className="text-[11px] sm:text-xs">
        <CardRating rating={product.rating} count={product.reviewCount} />
      </div>
    ) : null;

  const categoryLabel = isListing ? cardCategoryLabel(product.category, intent.opportunityCategory) : null;
  const showShop = !product.inShopContext;

  const titleBlock = textFirst ? null : (
    <>
      {isListing && intent.label ? (
        <p className={`truncate text-[11px] font-bold uppercase tracking-wide ${INTENT_ACCENT[tone]}`}>
          {intent.label}
        </p>
      ) : null}
      <Link href={productHref} className="dm-focus block outline-none" title={product.title}>
        <h3 className={titleClass}>{product.title}</h3>
      </Link>
    </>
  );

  const priceRow = (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span
        className={`tabular-nums text-accent ${
          isListing
            ? "text-[17px] font-bold sm:text-lg"
            : layout === "horizontal"
              ? "text-base font-extrabold sm:text-lg"
              : "text-[15px] font-extrabold sm:text-base"
        }`}
      >
        {isBudget ? `Budget: ${displayPrice}` : displayPrice}
      </span>
      {isDiscounted && (
        <span className="text-[11px] font-medium text-muted line-through tabular-nums sm:text-xs">
          {formatUGX(product.originalPriceUGX ?? product.priceUGX)}
        </span>
      )}
      {listingKind === "product" && price > 0 && product.negotiable !== false && (
        <span className="text-[10px] font-medium text-muted">· Negotiable</span>
      )}
    </div>
  );

  const metaRow = (
    <div className="space-y-0.5 text-[10px] text-muted sm:text-[11px]">
      {listingKind === "opportunity" && whenLabel ? (
        <p
          className={`flex items-center gap-1 ${
            deadlineUrgent ? "font-semibold text-red-600 dark:text-red-400" : ""
          }`}
        >
          <CalendarDays className="size-3 shrink-0" strokeWidth={2} aria-hidden />
          <span className={`truncate font-medium ${deadlineUrgent ? "" : "text-foreground/80"}`}>{whenLabel}</span>
        </p>
      ) : null}
      <p className="flex items-center gap-1">
        {locationOnline && !serviceArea ? null : (
          <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
        )}
        <span className="truncate font-medium text-foreground/80">{placeText}</span>
      </p>
    </div>
  );

  const details = (
    <>
      {titleBlock}
      {categoryLabel ? (
        <p className="truncate text-[13px] font-medium text-muted">{categoryLabel}</p>
      ) : null}
      {showShop ? shopRow : null}
      {rating}
      {priceRow}
      {metaRow}
    </>
  );

  const cta = (compact: boolean) => (
    <CardCta
      cta={intent.cta}
      waHref={waHref}
      applicationLink={safeApplicationLink(listingMeta.application_link)}
      productId={product.id}
      productHref={productHref}
      shopId={product.shop.id}
      sellerId={product.sellerId}
      category={product.category ?? undefined}
      hasDiscount={isDiscounted}
      compact={compact}
    />
  );

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
          {showShop ? <ShopLogo name={product.shop.name} logoUrl={product.shopLogoUrl} /> : null}
          {videoBadge}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
          <div className="space-y-1">{details}</div>
          {cta(true)}
        </div>
      </article>
    );
  }

  return (
    <article
      ref={impressionRef as React.RefObject<HTMLElement>}
      className="dm-product-card dm-card-hover flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden"
    >
      <div className="group relative aspect-square w-full overflow-hidden bg-surface-subtle sm:aspect-[4/3]">
        <Link href={productHref} className="dm-focus relative block h-full w-full outline-none">
          {coverFrame("(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw")}
        </Link>
        {imageBadges}
        {likeFloating}
        {showShop ? <ShopLogo name={product.shop.name} logoUrl={product.shopLogoUrl} /> : null}
        {videoBadge}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
        {details}
        <div className="mt-auto pt-1.5">{cta(false)}</div>
      </div>
    </article>
  );
}
