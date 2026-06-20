import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { productImageUrls, productPriceUgx } from "@/lib/api/products";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductPageEffects from "@/components/product/ProductPageEffects";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { VerifiedIcon } from "@/components/icons/VerifiedIcon";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import { productPageSlug, resolveProductIdFromPageSlug } from "@/lib/productUrl";
import { getProductById, getShopById } from "@/lib/api/server";
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
    keywords: [product.title, product.category ?? "", "Midora Online", "Uganda"].filter(Boolean),
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

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <ProductPageEffects productId={product.id} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link
          href="/products"
          className="font-medium text-muted transition-colors hover:text-foreground"
        >
          Products
        </Link>
        <ChevronRight className="size-3.5 shrink-0 text-muted/50" aria-hidden />
        <span className="min-w-0 truncate text-foreground/80">{product.title}</span>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
        {/* Gallery */}
        <div className="min-w-0">
          <ProductImageGallery images={images} title={product.title}>
            {shop ? (
              <Link
                href={`/shops/${shop.slug}`}
                className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              >
                <div className="size-6 overflow-hidden rounded-lg bg-foreground/[0.06]">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[9px] font-bold text-muted">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {shop.name}
              </Link>
            ) : null}
          </ProductImageGallery>
        </div>

        {/* Details */}
        <div className="min-w-0 space-y-5">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-foreground/[0.05] px-2.5 py-0.5 text-[10px] font-medium text-muted">
                {product.item_type === "service" ? "Service" : "Product"}
              </span>
              {product.boosted && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                  Promoted
                </span>
              )}
              {product.status === "active" && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600">
                  Active
                </span>
              )}
              {freshness && (
                <span className="rounded-full bg-foreground/[0.05] px-2.5 py-0.5 text-[10px] font-medium text-muted">
                  {freshness}
                </span>
              )}
            </div>
            <h1 className="font-display mt-2 text-xl font-semibold tracking-tight text-pretty sm:text-2xl">
              {product.title}
            </h1>
            <p className="mt-3 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {formatUGX(price)}
            </p>
            <div className="mt-2">
              {reviewStats.total_reviews > 0 ? (
                <StarRating
                  rating={reviewStats.average_rating}
                  count={reviewStats.total_reviews}
                  size="sm"
                />
              ) : (
                <StarRating rating={0} size="sm" placeholder />
              )}
            </div>
          </div>

          {/* Shop Info */}
          {shop && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <Link
                href={`/shops/${shop.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="size-10 overflow-hidden rounded-xl bg-foreground/[0.06] ring-1 ring-foreground/[0.06]">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs font-bold text-muted">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors">
                    {shop.name}
                    {verifiedShop && <VerifiedIcon className="ml-1 inline !text-sm" />}
                  </p>
                  <p className="text-xs text-muted">
                    {shop.available_now ? (
                      <span className="font-medium text-emerald-600">Available now</span>
                    ) : (
                      "Shop on Midora"
                    )}
                  </p>
                </div>
                <MaterialSymbol name="chevron_right" className="!text-lg shrink-0 text-muted" />
              </Link>
            </div>
          )}

          {/* Contact seller */}
          <div className="flex flex-col gap-2">
            {waHref && shop ? (
              <SellerContactConsent
                shopId={shop.id}
                productId={product.id}
                whatsappNumber={shop.whatsapp_number ?? ""}
                listingUrl={listingUrl}
                title={product.title}
              >
                <div className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98]">
                  <WhatsAppIcon className="size-4 shrink-0 text-white" />
                  Message seller on WhatsApp
                </div>
              </SellerContactConsent>
            ) : shop ? (
              <p className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-xs text-muted">
                WhatsApp not connected — visit the shop page for other contact options.
              </p>
            ) : null}

            {shop && shop.owner_id && (
              <MessageSellerButton
                sellerId={shop.owner_id}
                shopId={shop.id}
                productId={product.id}
                className="w-full rounded-xl py-3 text-sm"
              />
            )}

            {/* Trust + secondary actions */}
            <div className="flex items-center justify-between pt-1">
              {verifiedShop ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <MaterialSymbol name="verified" className="!text-sm" />
                  Verified seller
                </span>
              ) : (
                <span className="text-xs text-muted">Seller on Midora</span>
              )}
              <div className="flex items-center gap-2">
                <ProductLikeButton
                  productId={product.id}
                  initialLikeCount={product.like_count ?? 0}
                  initialLiked={product.viewer_liked ?? undefined}
                />
                {shop && (
                  <Link
                    href={`/shops/${shop.slug}`}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.04]"
                  >
                    View shop
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Listing details */}
          {(product.category || product.location_name || (product.item_type === "product" && product.stock_quantity != null) || product.updated_at) && (
            <section className="overflow-hidden rounded-xl border border-border bg-surface">
              <h2 className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Listing details
              </h2>
              <dl className="divide-y divide-border text-sm">
                {product.category && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol name="category" className="!text-sm" />
                      Category
                    </dt>
                    <dd className="font-medium text-foreground">{product.category}</dd>
                  </div>
                )}
                {product.location_name && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol name="location_on" className="!text-sm" />
                      Location
                    </dt>
                    <dd className="font-medium text-foreground">{product.location_name}</dd>
                  </div>
                )}
                {product.item_type === "product" && product.stock_quantity != null && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol name="inventory_2" className="!text-sm" />
                      In stock
                    </dt>
                    <dd className="font-medium text-foreground">{product.stock_quantity} units</dd>
                  </div>
                )}
                {product.updated_at && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                      <MaterialSymbol name="schedule" className="!text-sm" />
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

          {/* Activity & report */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {product.view_count != null && (
              <span className="flex items-center gap-1">
                <MaterialSymbol name="visibility" className="!text-sm" />
                {product.view_count} views
              </span>
            )}
            {product.like_count != null && (
              <span className="flex items-center gap-1">
                <MaterialSymbol name="favorite" className="!text-sm" />
                {product.like_count} likes
              </span>
            )}
            <ReportListing productId={product.id} />
          </div>

          {/* Owner actions */}
          {shop && (
            <ProductOwnerActions
              shopOwnerId={shop.owner_id ?? undefined}
              shopSlug={shop.slug ?? undefined}
              shopId={shop.id}
            />
          )}

          {/* Description */}
          {product.description && (
            <section className="overflow-hidden rounded-xl border border-border bg-surface">
              <h2 className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Description
              </h2>
              <p className="px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </section>
          )}

          {/* Reviews */}
          <ProductReviews productId={product.id} />

          {/* Comments */}
          <ProductComments productId={product.id} />
        </div>
      </div>

      {/* Similar products */}
      <SimilarProducts productId={product.id} />
    </div>
  );
}
