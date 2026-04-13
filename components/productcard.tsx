import Image from "next/image";
import Link from "next/link";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  imageUrl?: string;
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

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="block dm-card dm-card-hover overflow-hidden dm-focus"
    >
      <div className="relative aspect-[4/3] w-full bg-primary/5">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            No image
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm font-semibold tracking-tight line-clamp-2">
          {product.title}
        </p>
        <p className="mt-2 text-sm text-foreground/90">
          {formatUGX(product.priceUGX)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Sold by</span>
          <Link
            href={`/shops/${product.shop.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-foreground/80 dm-focus"
          >
            {product.shop.name}
            {product.shop.verified ? (
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground/70">
                Verified
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </Link>
  );
}