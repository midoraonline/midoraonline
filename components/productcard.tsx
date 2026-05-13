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
  /** Shown on image hover (e.g. shop storefront cards). */
  description?: string | null;
  /** When true, hide shop branding on the card — used on `/shops/...` where context is implicit. */
  inShopContext?: boolean;
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
  const inShop = product.inShopContext === true;
  const desc = product.description?.trim() ?? "";
  const productHref = `/products/${product.slug}`;

  return (
    <article className="dm-card dm-card-hover flex flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href={productHref} className="dm-focus group block outline-none">
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
            {!inShop ? (
              <ProductShopLogoOverlay
                shopName={product.shop.name}
                logoUrl={product.shopLogoUrl}
              />
            ) : null}
            {inShop && desc ? (
              <div
                className="pointer-events-none absolute inset-0 z-[6] flex items-end bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover:opacity-100"
                aria-hidden
              >
                <p className="line-clamp-5 max-h-[48%] overflow-hidden px-3 pb-3 pt-10 text-left text-xs leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[13px] sm:leading-relaxed">
                  {desc}
                </p>
              </div>
            ) : null}
          </div>
        </Link>

        <div className="flex flex-col px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
          <Link href={productHref} className="dm-focus mt-3 block outline-none">
            <p className="text-xs font-semibold tracking-tight line-clamp-2 sm:text-sm">{product.title}</p>
          </Link>
          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
            <Link
              href={productHref}
              className="dm-focus min-w-0 truncate text-xs font-medium tabular-nums text-foreground/90 sm:text-sm"
            >
              {formatUGX(product.priceUGX)}
            </Link>
            <ProductLikeButton productId={product.id} size="compact" className="shrink-0" />
          </div>

          {waHref ? (
            <>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="dm-focus mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-[filter] hover:brightness-95 sm:py-2 sm:text-sm"
              >
                <WhatsAppIcon className="size-4 shrink-0 text-white" />
                Chat on WhatsApp
              </a>
              {verified ? (
                <p className="mt-1 px-0.5 text-center text-[10px] font-medium leading-snug text-muted sm:text-[11px]">
                  <span className="text-foreground/90">✓ Verified seller</span>
                </p>
              ) : (
                <p className="mt-1 px-0.5 text-center text-[10px] text-muted sm:text-[11px]">
                  Seller on Midora
                </p>
              )}
            </>
          ) : null}

          {!inShop ? (
            <Link
              href={`/shops/${product.shop.slug}`}
              className="dm-focus mt-2 min-w-0 truncate rounded-full bg-foreground/[0.07] px-2 py-1 text-center text-[10px] font-semibold text-foreground/85 hover:bg-foreground/[0.1] sm:px-3 sm:text-xs"
            >
              <span className="truncate">{product.shop.name}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
