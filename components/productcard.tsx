import Image from "next/image";
import Link from "next/link";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import ProductShopLogoOverlay from "@/components/product/ProductShopLogoOverlay";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceUGX: number;
  imageUrl?: string;
  shopLogoUrl?: string;
  viewCount?: number;
  /** Shop WhatsApp (any format); inquiry opens wa.me with prefilled text. */
  shopWhatsApp?: string | null;
  /** Absolute product URL for the WhatsApp prefill (set by server feed). */
  listingUrl?: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    verified?: boolean;
    /** Shop storefront category (for browse filters). */
    category?: string | null;
  };
  /** Product listing category */
  category?: string | null;
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
  const waHref = product.shopWhatsApp?.trim()
    ? productInquiryWhatsAppUrl(product.shopWhatsApp, {
        itemTitle: product.title,
        itemUrl: product.listingUrl ?? undefined,
      })
    : null;
  const verified = product.shop.verified !== false;

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

      <div className="mt-auto space-y-2 border-t border-foreground/[0.06] px-3 py-2 sm:px-4 sm:py-3">
        {waHref ? (
          <>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-focus flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-[filter] hover:brightness-95 sm:py-2 sm:text-sm"
            >
              <WhatsAppIcon className="size-4 shrink-0 text-white" />
              Chat on WhatsApp
            </a>
            {verified ? (
              <p className="px-0.5 text-center text-[10px] font-medium leading-snug text-muted sm:text-[11px]">
                <span className="text-foreground/90">✓ Verified seller</span>
                <span> · Replies fast</span>
              </p>
            ) : (
              <p className="px-0.5 text-center text-[10px] text-muted sm:text-[11px]">Seller on Midora</p>
            )}
          </>
        ) : null}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <Link
            href={`/shops/${product.shop.slug}`}
            className="dm-focus min-w-0 truncate rounded-full bg-foreground/[0.07] px-2 py-1 text-[10px] font-semibold text-foreground/85 hover:bg-foreground/[0.1] sm:px-3 sm:text-xs"
          >
            <span className="truncate">{product.shop.name}</span>
          </Link>
          <ProductLikeButton productId={product.id} size="compact" className="shrink-0" />
        </div>
      </div>
    </article>
  );
}
