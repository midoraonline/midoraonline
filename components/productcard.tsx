import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
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
  const inShop = product.inShopContext === true;
  const desc = product.description?.trim() ?? "";
  const productHref = `/products/${product.slug}`;

  const viewCount =
    typeof product.viewCount === "number" ? product.viewCount : null;

  return (
    <article className="dm-card dm-card-hover flex flex-col overflow-hidden">
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

          {viewCount !== null ? (
            <div className="absolute bottom-1.5 right-1.5 z-[5] inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm leading-none">
              <MaterialSymbol name="visibility" className="!text-[11px] leading-none" />
              {viewCount}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-col gap-1.5 px-2 pb-2 pt-1.5">
        <Link href={productHref} className="dm-focus block outline-none">
          <p className="line-clamp-1 text-xs font-semibold tracking-tight sm:text-sm">{product.title}</p>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <Link
            href={productHref}
            className="dm-focus min-w-0 truncate text-xs font-semibold tabular-nums text-accent"
          >
            {formatUGX(product.priceUGX)}
          </Link>

          <ProductLikeButton productId={product.id} size="compact" className="shrink-0" />
        </div>

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="dm-focus inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-semibold text-white transition-[filter] hover:brightness-95"
          >
            <WhatsAppIcon className="size-3 shrink-0 text-white" />
            WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  );
}
