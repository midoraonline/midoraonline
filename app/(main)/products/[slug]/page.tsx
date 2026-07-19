import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
import { MaterialSymbol } from "@/components/MaterialSymbol";
import StarRating from "@/components/StarRating";
import { getProductReviewStats } from "@/lib/api/reviews";

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
  const product = await getProductById(id);
  if (!product) notFound();

  const canonicalSlug = productPageSlug(product);
  if (slug !== canonicalSlug) {
    redirect(`/products/${canonicalSlug}`);
  }

  const shop = product.shop;

  const reviewStats = await getProductReviewStats(id);

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
  const verifiedShop = shop?.is_active !== false;
  const freshness = timeAgo(product.updated_at || product.created_at);
  const inStock =
    product.item_type === "product" &&
    product.stock_quantity != null &&
    product.stock_quantity > 0;
  const lowStock = inStock && (product.stock_quantity ?? 0) <= 3;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <ProductPageEffects productId={product.id} />

      {/* Breadcrumb — skill §4.1 #1 */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="dm-link font-medium">
          Products
        </Link>
        <ChevronRight
          className="size-3.5 shrink-0 text-muted/50"
          aria-hidden="true"
        />
        <span className="min-w-0 truncate text-foreground/80">{product.title}</span>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
        {/* Gallery — skill §4.1 #2 */}
        <div className="min-w-0">
          <ProductImageGallery images={images} title={product.title}>
            {shop ? (
              <ProductShopLogoOverlay
                shopName={shop.name}
                logoUrl={shop.logo_url}
                shopHref={`/shops/${shop.slug}`}
                className="!left-3 !top-auto !bottom-3 !right-auto"
              />
            ) : null}
          </ProductImageGallery>
        </div>

        {/* Buy box — skill §4.1 #3 */}
        <div className="min-w-0 space-y-5">
          {/* Header: chips → title → price → rating */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="dm-pill bg-surface-subtle px-2.5 py-0.5 text-[10px] font-medium text-muted">
                {product.item_type === "service" ? "Service" : "Product"}
              </span>
              {product.category ? (
                <CategoryDisplay label={product.category} variant="chip" />
              ) : null}
              {product.boosted && (
                <span
                  className="dm-pill px-2.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  Promoted
                </span>
              )}
              {freshness && (
                <span className="dm-pill bg-surface-subtle px-2.5 py-0.5 text-[10px] font-medium text-muted">
                  {freshness}
                </span>
              )}
            </div>

            <h1 className="font-display mt-2 text-xl font-semibold tracking-tight text-pretty sm:text-2xl">
              {product.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
                {formatUGX(price)}
              </p>
              {isDiscounted && (
                <>
                  <p className="text-base font-medium text-muted line-through">
                    {formatUGX(originalPrice)}
                  </p>
                  <span
                    className="dm-pill px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      background: "var(--error-subtle)",
                      color: "var(--error)",
                    }}
                  >
                    -{discountPct}% off
                  </span>
                </>
              )}
            </div>

            <div className="mt-2">
              {reviewStats.total_reviews > 0 ? (
                <a href="#reviews" className="inline-block">
                  <StarRating
                    rating={reviewStats.average_rating}
                    count={reviewStats.total_reviews}
                    size="sm"
                  />
                </a>
              ) : (
                <StarRating rating={0} size="sm" placeholder />
              )}
            </div>
          </div>

          {/* Seller strip — skill §4.1 #3 */}
          {shop && (
            <Link
              href={`/shops/${shop.slug}`}
              className="dm-card group flex items-center gap-3 p-3 transition-colors hover:border-border-strong"
            >
              <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-subtle ring-1 ring-border">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
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
                <p className="text-sm font-semibold transition-colors group-hover:text-accent">
                  {shop.name}
                  {verifiedShop && (
                    <VerifiedIcon className="ml-1 inline !text-sm" aria-label="Verified" />
                  )}
                </p>
                <p className="text-xs text-muted">
                  {shop.available_now ? (
                    <span
                      className="font-medium"
                      style={{ color: "var(--success)" }}
                    >
                      Available now
                    </span>
                  ) : (
                    "Shop on Midora"
                  )}
                </p>
              </div>
              <MaterialSymbol
                name="chevron_right"
                className="!text-lg shrink-0 text-muted"
                aria-hidden="true"
              />
            </Link>
          )}

          {/* Trust bar — skill §4.1 #3 */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
            {verifiedShop && (
              <li
                className="inline-flex items-center gap-1.5 font-medium"
                style={{ color: "var(--success)" }}
              >
                <MaterialSymbol name="verified_user" className="!text-sm" aria-hidden="true" />
                Verified seller
              </li>
            )}
            {waHref ? (
              <li className="inline-flex items-center gap-1.5">
                <MaterialSymbol name="chat" className="!text-sm" aria-hidden="true" />
                Replies on WhatsApp
              </li>
            ) : null}
            {inStock && (
              <li
                className="inline-flex items-center gap-1.5 font-medium"
                style={{ color: lowStock ? "var(--warning)" : "var(--success)" }}
              >
                <MaterialSymbol name="inventory_2" className="!text-sm" aria-hidden="true" />
                {lowStock
                  ? `Only ${product.stock_quantity} left`
                  : `${product.stock_quantity} in stock`}
              </li>
            )}
            {product.location_name && (
              <li className="inline-flex items-center gap-1.5">
                <MaterialSymbol name="location_on" className="!text-sm" aria-hidden="true" />
                {product.location_name}
              </li>
            )}
          </ul>

          {/* Primary + secondary CTAs — skill §4.1 #3 */}
          <div id="pdp-buybox-end" className="space-y-2">
            <div className="flex gap-2">
              {waHref && shop ? (
                <SellerContactConsent
                  shopId={shop.id}
                  productId={product.id}
                  whatsappNumber={shop.whatsapp_number ?? ""}
                  listingUrl={listingUrl}
                  title={product.title}
                >
                  <div
                    className="dm-btn flex-1 cursor-pointer text-white shadow-sm transition-transform active:scale-[0.98]"
                    style={{ background: "#25D366" }}
                  >
                    <WhatsAppIcon
                      className="size-4 shrink-0 text-white"
                      aria-hidden="true"
                    />
                    Message on WhatsApp
                  </div>
                </SellerContactConsent>
              ) : shop ? (
                <p className="dm-card flex-1 px-4 py-3 text-center text-xs text-muted">
                  WhatsApp not connected
                </p>
              ) : null}

              {shop && shop.owner_id && (
                <div className="flex-1">
                  <MessageSellerButton
                    sellerId={shop.owner_id}
                    shopId={shop.id}
                    productId={product.id}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <ProductLikeButton
                productId={product.id}
                initialLikeCount={product.like_count ?? 0}
                initialLiked={product.viewer_liked ?? undefined}
              />
              {shop && (
                <Link
                  href={`/shops/${shop.slug}`}
                  className="dm-btn dm-btn-secondary dm-btn-sm"
                >
                  View shop
                </Link>
              )}
            </div>
          </div>

          {/* Owner actions */}
          {shop && (
            <ProductOwnerActions
              shopOwnerId={shop.owner_id ?? undefined}
              shopSlug={shop.slug ?? undefined}
              shopId={shop.id}
              productId={product.id}
              isPublished={product.is_published}
              productPriceUgx={productPriceUgx(product)}
              productDiscountPrice={product.discount_price}
            />
          )}

          {/* Description — skill §4.2 #3 */}
          {product.description && (
            <section className="dm-card overflow-hidden">
              <h2 className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Description
              </h2>
              <p className="px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {product.description}
              </p>
            </section>
          )}

          {/* Specifications — skill §4.2 #4 */}
          {(product.category ||
            product.location_name ||
            (product.item_type === "product" && product.stock_quantity != null) ||
            product.updated_at) && (
            <section className="dm-card overflow-hidden">
              <h2 className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Listing details
              </h2>
              <dl className="divide-y divide-border text-sm">
                {product.category && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol
                        name="category"
                        className="!text-sm"
                        aria-hidden="true"
                      />
                      Category
                    </dt>
                    <dd className="min-w-0 flex-1">
                      <CategoryDisplay label={product.category} variant="detail" />
                    </dd>
                  </div>
                )}
                {product.location_name && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol
                        name="location_on"
                        className="!text-sm"
                        aria-hidden="true"
                      />
                      Location
                    </dt>
                    <dd className="font-medium text-foreground">{product.location_name}</dd>
                  </div>
                )}
                {product.item_type === "product" && product.stock_quantity != null && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol
                        name="inventory_2"
                        className="!text-sm"
                        aria-hidden="true"
                      />
                      In stock
                    </dt>
                    <dd className="font-medium text-foreground">
                      {product.stock_quantity} units
                    </dd>
                  </div>
                )}
                {product.updated_at && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol
                        name="schedule"
                        className="!text-sm"
                        aria-hidden="true"
                      />
                      Updated
                    </dt>
                    <dd className="font-medium text-foreground">
                      {new Date(product.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Activity + report */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {product.view_count != null && (
              <span className="inline-flex items-center gap-1">
                <MaterialSymbol name="visibility" className="!text-sm" aria-hidden="true" />
                {product.view_count} views
              </span>
            )}
            {product.like_count != null && (
              <span className="inline-flex items-center gap-1">
                <MaterialSymbol name="favorite" className="!text-sm" aria-hidden="true" />
                {product.like_count} likes
              </span>
            )}
            <ReportListing productId={product.id} />
          </div>

          {/* Reviews — skill §4.2 #5 */}
          <div id="reviews" className="scroll-mt-24">
            <ProductReviews productId={product.id} />
          </div>

          {/* Comments — skill §4.2 #6 */}
          <ProductComments productId={product.id} />
        </div>
      </div>

      {/* Similar products — skill §4.2 #7 */}
      <SimilarProducts productId={product.id} />

      {/* Sticky mobile action bar — skill §4.2 #9 */}
      {(waHref || (shop && shop.owner_id)) && (
        <PdpStickyActionBar sentinelId="pdp-buybox-end">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tabular-nums text-foreground">
              {formatUGX(price)}
            </p>
            {isDiscounted ? (
              <p className="truncate text-[11px] text-muted line-through">
                {formatUGX(originalPrice)}
              </p>
            ) : (
              <p className="truncate text-[11px] text-muted">{product.title}</p>
            )}
          </div>
          {waHref && shop ? (
            <SellerContactConsent
              shopId={shop.id}
              productId={product.id}
              whatsappNumber={shop.whatsapp_number ?? ""}
              listingUrl={listingUrl}
              title={product.title}
            >
              <div
                className="dm-btn cursor-pointer text-white shadow-sm active:scale-[0.98]"
                style={{ background: "#25D366" }}
              >
                <WhatsAppIcon
                  className="size-4 shrink-0 text-white"
                  aria-hidden="true"
                />
                WhatsApp
              </div>
            </SellerContactConsent>
          ) : shop && shop.owner_id ? (
            <MessageSellerButton
              sellerId={shop.owner_id}
              shopId={shop.id}
              productId={product.id}
            />
          ) : null}
        </PdpStickyActionBar>
      )}
    </div>
  );
}
