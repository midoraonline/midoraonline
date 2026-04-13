import Image from "next/image";
import Link from "next/link";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductShopLogoOverlay from "@/components/product/ProductShopLogoOverlay";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  imageUrl?: string;
  /** Shop logo shown on the product image (top-right). */
  shopLogoUrl?: string;
  shop: {
    id: string;
    name: string;
    slug: string;
    verified?: boolean;
  };
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

export default function ProductCard({ product }: { product: ProductCardData }) {
  const unopt = product.imageUrl ? userMediaUnoptimized(product.imageUrl) : false;

  return (
    <article className="dm-card dm-card-hover flex flex-col overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        className="dm-focus group flex min-h-0 flex-1 flex-col outline-none"
      >
        <div className="relative aspect-[4/3] w-full bg-foreground/[0.04]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={unopt}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted">
              No image
            </div>
          )}
          <ProductShopLogoOverlay
            shopName={product.shop.name}
            logoUrl={product.shopLogoUrl}
          />
        </div>

        <div className="p-5 pb-3">
          <p className="text-sm font-semibold tracking-tight line-clamp-2">{product.title}</p>
          <p className="mt-2 text-sm text-foreground/90">{formatUGX(product.priceUGX)}</p>
        </div>
      </Link>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-foreground/[0.06] px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Sold by</span>
          <Link
            href={`/shops/${product.shop.slug}`}
            className="dm-focus inline-flex max-w-[min(100%,12rem)] items-center gap-2 truncate rounded-full bg-foreground/[0.07] px-3 py-1 text-xs font-semibold text-foreground/85 hover:bg-foreground/[0.1]"
          >
            <span className="truncate">{product.shop.name}</span>
            {product.shop.verified ? (
              <span className="shrink-0 rounded-full bg-foreground/[0.08] px-2 py-0.5 text-[10px] font-semibold text-foreground/70">
                Verified
              </span>
            ) : null}
          </Link>
        </div>
        <ProductLikeButton productId={product.id} size="compact" className="shrink-0" />
      </div>
    </article>
  );
}
