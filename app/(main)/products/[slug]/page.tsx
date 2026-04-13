import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiProducts, apiShops } from "@/lib/api";
import { productImageUrls, productPriceUgx } from "@/lib/api/products";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductPageEffects from "@/components/product/ProductPageEffects";
import ProductShopLogoOverlay from "@/components/product/ProductShopLogoOverlay";

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

export default async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await apiProducts.getProduct(slug);
  } catch {
    notFound();
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
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <ProductPageEffects productId={slug} />

      <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="font-medium text-muted transition-colors hover:text-foreground">
          Products
        </Link>
        <span className="text-muted" aria-hidden>
          /
        </span>
        <span className="truncate text-foreground/90">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <div className="space-y-3">
          {images[0] ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-foreground/[0.08] bg-foreground/[0.04] shadow-sm">
              <Image
                src={images[0]}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={userMediaUnoptimized(images[0])}
              />
              {shop ? (
                <ProductShopLogoOverlay
                  shopName={shop.name}
                  logoUrl={shop.logo_url}
                  shopHref={`/shops/${shop.slug}`}
                />
              ) : null}
            </div>
          ) : (
            <div className="relative grid aspect-[4/3] place-items-center rounded-3xl border border-dashed border-foreground/[0.12] bg-foreground/[0.03] text-sm text-muted">
              No image
              {shop ? (
                <ProductShopLogoOverlay
                  shopName={shop.name}
                  logoUrl={shop.logo_url}
                  shopHref={`/shops/${shop.slug}`}
                />
              ) : null}
            </div>
          )}
          {images.length > 1 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1 pt-1" aria-label="More images">
              {images.map((url, i) => (
                <li
                  key={`${url}-${i}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-foreground/[0.04] sm:h-24 sm:w-24"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={userMediaUnoptimized(url)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {product.item_type === "service" ? "Service" : "Product"}
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-pretty sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatUGX(price)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
            <div className="dm-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold tracking-tight">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
                {product.description}
              </p>
            </div>
          ) : null}

          <dl className="grid gap-2 text-sm">
            {product.item_type === "product" && product.stock_quantity != null ? (
              <div className="flex gap-2">
                <dt className="font-medium text-foreground/85">Stock</dt>
                <dd className="text-muted">{product.stock_quantity}</dd>
              </div>
            ) : null}
            {product.view_count != null ? (
              <div className="flex gap-2">
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
