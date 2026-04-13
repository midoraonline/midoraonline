import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { apiProducts, apiShops } from "@/lib/api";
import { productImageUrls, productPriceUgx } from "@/lib/api/products";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductPageEffects from "@/components/product/ProductPageEffects";
import ProductShopLogoOverlay from "@/components/product/ProductShopLogoOverlay";
import { productPageSlug, resolveProductIdFromPageSlug } from "@/lib/productUrl";

const SITE = "https://www.midoraonline.com";

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

async function loadProduct(id: string) {
  try {
    return await apiProducts.getProduct(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = resolveProductIdFromPageSlug(slug);
  const product = await loadProduct(id);
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
  const product = await loadProduct(id);
  if (!product) notFound();

  const canonicalSlug = productPageSlug(product);
  if (slug !== canonicalSlug) {
    redirect(`/products/${canonicalSlug}`);
  }

  let shop: Awaited<ReturnType<typeof apiShops.getShop>> | null = null;
  try {
    shop = await apiShops.getShop(product.shop_id);
  } catch {
    shop = null;
  }

  const images = productImageUrls(product);
  const price = productPriceUgx(product);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-8">
      <ProductPageEffects productId={product.id} />

      <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="font-medium text-muted transition-colors hover:text-foreground">
          Products
        </Link>
        <span className="text-muted" aria-hidden>
          /
        </span>
        <span className="min-w-0 truncate text-foreground/90">{product.title}</span>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-3">
          <ProductImageGallery images={images} title={product.title}>
            {shop ? (
              <ProductShopLogoOverlay
                shopName={shop.name}
                logoUrl={shop.logo_url}
                shopHref={`/shops/${shop.slug}`}
              />
            ) : null}
          </ProductImageGallery>
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {product.item_type === "service" ? "Service" : "Product"}
            </p>
            <h1 className="font-display mt-2 text-xl font-semibold tracking-tight text-pretty sm:text-2xl md:text-3xl">
              {product.title}
            </h1>
            <p className="mt-3 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:mt-4 sm:text-2xl">
              {formatUGX(price)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ProductLikeButton productId={product.id} />
            {shop ? (
              <Link
                href={`/shops/${shop.slug}`}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View shop
              </Link>
            ) : null}
          </div>

          {product.category ? (
            <p className="text-sm">
              <span className="font-medium text-foreground/85">Category</span>
              <span className="text-muted"> · {product.category}</span>
            </p>
          ) : null}

          {product.description ? (
            <div className="dm-card p-4 sm:p-6">
              <h2 className="text-sm font-semibold tracking-tight">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
                {product.description}
              </p>
            </div>
          ) : null}

          <dl className="grid gap-2 text-sm">
            {product.item_type === "product" && product.stock_quantity != null ? (
              <div className="flex flex-wrap gap-2">
                <dt className="font-medium text-foreground/85">Stock</dt>
                <dd className="text-muted">{product.stock_quantity}</dd>
              </div>
            ) : null}
            {product.view_count != null ? (
              <div className="flex flex-wrap gap-2">
                <dt className="font-medium text-foreground/85">Views</dt>
                <dd className="tabular-nums text-muted">{product.view_count}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
