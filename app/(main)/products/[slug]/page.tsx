import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight,
  Heart,
  MapPin,
  Package,
  Star,
  Store,
} from "lucide-react";
import {
  productImageUrls,
  productPriceUgx,
  productOriginalPriceUgx,
  productIsDiscounted,
  productDiscountPercent,
} from "@/lib/api/products";
import CategoryDisplay from "@/components/CategoryDisplay";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductPageEffects from "@/components/product/ProductPageEffects";
import ProductShopLogoOverlay from "@/components/product/ProductShopLogoOverlay";
import PdpStickyActionBar from "@/components/product/PdpStickyActionBar";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { productPageSlug, resolveProductIdFromPageSlug } from "@/lib/productUrl";
import { getProductById } from "@/lib/api/server";
import SellerContactConsent from "@/components/product/SellerContactConsent";
import ReportListing from "@/components/product/ReportListing";
import ProductOwnerActions from "@/components/product/ProductOwnerActions";
import ProductComments from "@/components/product/ProductComments";
import ProductReviews from "@/components/product/ProductReviews";
import SimilarProducts from "@/components/product/SimilarProducts";
import MessageSellerButton from "@/components/chat/MessageSellerButton";
import { getProductReviewStats } from "@/lib/api/reviews";
import {
  resolveShopTrustLevel,
  SHOP_TRUST_LABEL,
} from "@/lib/productCardMap";

const SITE = "https://www.midoraonline.com";

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = resolveProductIdFromPageSlug(slug);
  const product = await getProductById(id);
  if (!product) {
    return { title: "Product | Midora Online" };
  }

  const canonicalSlug = productPageSlug(product);
  const path = `/products/${canonicalSlug}`;
  const url = `${SITE}${path}`;
  const images = productImageUrls(product);
  const price = productPriceUgx(product);
  const desc =
    (product.description && product.description.trim().slice(0, 160)) ||
    `${product.title} — ${formatUGX(price)} on Midora Online.`;
  const ogImages = images[0]
    ? [{ url: images[0], alt: product.title }]
    : [{ url: `${SITE}/logo.png`, alt: "Midora Online" }];

  return {
    title: `${product.title} | Midora Online`,
    description: desc,
    keywords: [product.title, product.category ?? "", "Midora Online", "Uganda"].filter(
      Boolean,
    ),
    openGraph: {
      title: product.title,
      description: desc,
      url,
      type: "website",
      siteName: "Midora Online",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: desc,
      images: ogImages.map((i) => i.url),
    },
    alternates: { canonical: url },
  };
}

export default async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = resolveProductIdFromPageSlug(slug);
  const [product, reviewStats] = await Promise.all([
    getProductById(id),
    getProductReviewStats(id).catch(() => null),
  ]);
  if (!product) notFound();

  const canonicalSlug = productPageSlug(product);
  if (slug !== canonicalSlug) {
    redirect(`/products/${canonicalSlug}`);
  }

  const shop = product.shop;
  const images = productImageUrls(product);
  const price = productPriceUgx(product);
  const originalPrice = productOriginalPriceUgx(product);
  const isDiscounted = productIsDiscounted(product);
  const discountPct = productDiscountPercent(product);
  const productPath = `/products/${canonicalSlug}`;
  const listingUrl = `${SITE}${productPath}`;
  const waHref =
    shop?.whatsapp_number?.trim() &&
    productInquiryWhatsAppUrl(shop.whatsapp_number, {
      itemTitle: product.title,
      itemUrl: listingUrl,
    });

  const freshness = timeAgo(product.updated_at || product.created_at);
  const location =
    product.location_name?.trim() || shop?.location?.trim() || null;
  const trustLevel = resolveShopTrustLevel(shop?.trust_badges);
  const ratingAvg =
    reviewStats && reviewStats.total_reviews > 0
      ? reviewStats.average_rating
      : product.average_rating ?? 0;
  const ratingCount =
    reviewStats?.total_reviews ?? product.review_count ?? 0;

  const inStock =
    product.item_type === "product" &&
    product.stock_quantity != null &&
    product.stock_quantity > 0;
  const lowStock = inStock && (product.stock_quantity ?? 0) <= 3;
  const isNegotiable = product.is_negotiable !== false;
  const shopLive = shop?.available_now === true;

  const discountEndsLabel =
    isDiscounted && product.discount_expires_at
      ? (() => {
          const ends = new Date(product.discount_expires_at).getTime();
          if (Number.isNaN(ends) || ends < Date.now()) return null;
          return new Date(product.discount_expires_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
        })()
      : null;

  return (
    <div className="w-full space-y-6 pb-24 sm:space-y-8 sm:pb-8">
      <ProductPageEffects productId={product.id} />

      <nav className="flex items-center gap-1 text-[11px] sm:text-xs" aria-label="Breadcrumb">
        <Link href="/products" className="font-medium text-muted transition-colors hover:text-accent">
          Products
        </Link>
        <ChevronRight className="size-3 shrink-0 text-muted/40" aria-hidden />
        {product.category ? (
          <>
            <CategoryDisplay label={product.category} variant="inline" className="!text-[11px] sm:!text-xs" />
            <ChevronRight className="size-3 shrink-0 text-muted/40" aria-hidden />
          </>
        ) : null}
        <span className="min-w-0 truncate text-foreground/70">{product.title}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-8">
        {/* Gallery */}
        <div className="min-w-0 lg:sticky lg:top-20">
          <ProductImageGallery images={images} title={product.title}>
            {shop ? (
              <ProductShopLogoOverlay
                shopName={shop.name}
                logoUrl={shop.logo_url}
                className="!left-3 !top-auto !right-auto !bottom-3"
              />
            ) : null}
          </ProductImageGallery>
        </div>

        {/* Buy box */}
        <div className="min-w-0 space-y-4">
          <header className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
              {product.boosted ? (
                <span className="rounded-md bg-accent px-1.5 py-0.5 font-semibold uppercase tracking-wide text-white">
                  Hot
                </span>
              ) : null}
              {shopLive ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
                  Live now
                </span>
              ) : null}
              {freshness ? (
                <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-muted">
                  {freshness}
                </span>
              ) : null}
              {product.item_type === "service" ? (
                <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-muted">
                  Service
                </span>
              ) : null}
            </div>

            <h1 className="font-display text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-2xl font-extrabold tabular-nums tracking-tight text-accent sm:text-3xl">
                {formatUGX(price)}
              </p>
              {isDiscounted ? (
                <>
                  <p className="text-sm font-medium text-muted line-through tabular-nums">
                    {formatUGX(originalPrice)}
                  </p>
                  <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    -{discountPct}%
                  </span>
                </>
              ) : null}
              {isNegotiable ? (
                <span className="text-[11px] font-medium text-muted">· Negotiable</span>
              ) : null}
            </div>
            {discountEndsLabel ? (
              <p className="text-[11px] text-muted">Sale ends {discountEndsLabel}</p>
            ) : null}

            {/* Decision meta: rating · location · trust */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
              <a
                href="#reviews"
                className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-accent"
              >
                <Star
                  className={`size-3.5 ${ratingAvg > 0 ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                  aria-hidden
                />
                <span className="tabular-nums">{Number(ratingAvg || 0).toFixed(1)}</span>
                {ratingCount > 0 ? (
                  <span className="font-normal text-muted">({ratingCount})</span>
                ) : null}
              </a>

              {location ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="size-3.5 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                  <span className="truncate font-medium text-foreground/80">{location}</span>
                </span>
              ) : null}

              {trustLevel !== "registered" ? (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    trustLevel === "business" ? "text-accent" : "text-sky-600"
                  }`}
                >
                  <VerifiedIcon
                    className={
                      trustLevel === "business"
                        ? "!text-sm text-accent"
                        : "!text-sm text-sky-600"
                    }
                    size={14}
                    label={SHOP_TRUST_LABEL[trustLevel]}
                  />
                  {trustLevel === "business" ? "Business verified" : "Identity verified"}
                </span>
              ) : null}

              {inStock ? (
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    lowStock ? "text-[color:var(--warning)]" : "text-[color:var(--success)]"
                  }`}
                >
                  <Package className="size-3.5" strokeWidth={2} aria-hidden />
                  {lowStock
                    ? `Only ${product.stock_quantity} left`
                    : `${product.stock_quantity} in stock`}
                </span>
              ) : null}
            </div>
          </header>

          {/* Primary CTA — WhatsApp first (marketplace pattern) */}
          <div id="pdp-buybox-end" className="space-y-2">
            {waHref && shop ? (
              <SellerContactConsent
                shopId={shop.id}
                productId={product.id}
                whatsappNumber={shop.whatsapp_number ?? ""}
                listingUrl={listingUrl}
                title={product.title}
              >
                <div className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#22c35e] active:scale-[0.99]">
                  <WhatsAppIcon className="size-4 shrink-0 text-white" />
                  Chat on WhatsApp
                </div>
              </SellerContactConsent>
            ) : shop ? (
              <p className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-center text-xs text-muted">
                Seller hasn&apos;t connected WhatsApp yet
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <ProductLikeButton
                productId={product.id}
                initialLikeCount={product.like_count ?? 0}
                initialLiked={product.viewer_liked ?? undefined}
              />
              {shop?.owner_id ? (
                <div className="min-w-0 flex-1">
                  <MessageSellerButton
                    sellerId={shop.owner_id}
                    shopId={shop.id}
                    productId={product.id}
                    className="!w-full"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Seller */}
          {shop ? (
            <Link
              href={`/shops/${shop.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/30 hover:bg-accent/[0.03]"
            >
              <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-subtle ring-1 ring-border">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.logo_url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs font-bold text-muted">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{shop.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                  {shopLive ? (
                    <span className="font-medium text-[color:var(--success)]">Available now</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Store className="size-3" aria-hidden />
                      View shop
                    </span>
                  )}
                  {trustLevel !== "registered" ? (
                    <span
                      className={
                        trustLevel === "business" ? "font-medium text-accent" : "font-medium text-sky-600"
                      }
                    >
                      · {SHOP_TRUST_LABEL[trustLevel]}
                    </span>
                  ) : null}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          ) : null}

          {shop ? (
            <ProductOwnerActions
              shopOwnerId={shop.owner_id ?? undefined}
              shopSlug={shop.slug ?? undefined}
              shopId={shop.id}
              productId={product.id}
              isPublished={product.is_published}
              productPriceUgx={productPriceUgx(product)}
              productDiscountPrice={product.discount_price}
            />
          ) : null}

          {/* Description */}
          {product.description ? (
            <section className="space-y-2 border-t border-border pt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {product.description}
              </p>
              {product.ai_generated_desc ? (
                <p className="text-[11px] text-muted">Description assisted by Midora AI</p>
              ) : null}
            </section>
          ) : null}

          {/* Listing facts */}
          <section className="space-y-2 border-t border-border pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Details
            </h2>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {product.category ? (
                <div className="rounded-lg bg-surface-subtle px-3 py-2">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Category
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    <CategoryDisplay label={product.category} variant="inline" />
                  </dd>
                </div>
              ) : null}
              {product.created_at ? (
                <div className="rounded-lg bg-surface-subtle px-3 py-2">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Listed
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {new Date(product.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {freshness ? (
                      <span className="ml-1 text-xs font-normal text-muted">({freshness})</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {location ? (
                <div className="rounded-lg bg-surface-subtle px-3 py-2">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Location
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">{location}</dd>
                </div>
              ) : null}
              <div className="rounded-lg bg-surface-subtle px-3 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  Price type
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {isNegotiable ? "Negotiable" : "Fixed"}
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11px] text-muted">
            {product.view_count != null ? (
              <span>{product.view_count} views</span>
            ) : null}
            {product.like_count != null ? (
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" aria-hidden />
                {product.like_count}
              </span>
            ) : null}
            <ReportListing productId={product.id} />
          </div>

          <div id="reviews" className="scroll-mt-24 border-t border-border pt-4">
            <ProductReviews productId={product.id} />
          </div>

          <div className="border-t border-border pt-4">
            <ProductComments productId={product.id} />
          </div>
        </div>
      </div>

      <SimilarProducts productId={product.id} />

      {(waHref || (shop && shop.owner_id)) && (
        <PdpStickyActionBar sentinelId="pdp-buybox-end">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tabular-nums text-accent">
              {formatUGX(price)}
            </p>
            <p className="truncate text-[11px] text-muted">{product.title}</p>
          </div>
          {waHref && shop ? (
            <SellerContactConsent
              shopId={shop.id}
              productId={product.id}
              whatsappNumber={shop.whatsapp_number ?? ""}
              listingUrl={listingUrl}
              title={product.title}
            >
              <div className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]">
                <WhatsAppIcon className="size-3.5 shrink-0 text-white" />
                WhatsApp
              </div>
            </SellerContactConsent>
          ) : shop?.owner_id ? (
            <MessageSellerButton
              sellerId={shop.owner_id}
              shopId={shop.id}
              productId={product.id}
              compact
            />
          ) : null}
        </PdpStickyActionBar>
      )}
    </div>
  );
}
