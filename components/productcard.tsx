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
  shopLogoUrl?: string;
  viewCount?: number;
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
        <div className="relative aspect-square w-full bg-foreground/[0.04] sm:aspect-[4/3]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

        <div className="p-3 pb-2 sm:p-4 sm:pb-2">
          <p className="text-xs font-semibold tracking-tight line-clamp-2 sm:text-sm">{product.title}</p>
          <p className="mt-1 text-xs font-medium text-foreground/90 sm:text-sm">{formatUGX(product.priceUGX)}</p>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-foreground/[0.06] px-3 py-2 sm:gap-2 sm:px-4 sm:py-3">
        <Link
          href={`/shops/${product.shop.slug}`}
          className="dm-focus min-w-0 truncate rounded-full bg-foreground/[0.07] px-2 py-1 text-[10px] font-semibold text-foreground/85 hover:bg-foreground/[0.1] sm:px-3 sm:text-xs"
        >
          <span className="truncate">{product.shop.name}</span>
        </Link>
        <ProductLikeButton productId={product.id} size="compact" className="shrink-0" />
      </div>
    </article>
  );
}
