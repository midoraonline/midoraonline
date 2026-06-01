import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import ProductLikeButton from "@/components/product/ProductLikeButton";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { productInquiryWhatsAppUrl } from "@/lib/whatsappProduct";
import MessageSellerButton from "@/components/chat/MessageSellerButton";

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
  sellerId?: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    verified?: boolean;
    /** Shop storefront category (for browse filters). */
    category?: string | null;
    trust_score?: number | null;
    available_now?: boolean | null;
    location?: string | null;
  };
  /** Product listing category */
  category?: string | null;
  /** Shown on image hover (e.g. shop storefront cards). */
  description?: string | null;
  /** When true, hide shop branding on the card — used on `/shops/...` where context is implicit. */
  inShopContext?: boolean;
  /** Whether the listing has an active boost */
  boosted?: boolean;
  /** ISO timestamp for freshness calculation */
  updated_at?: string | null;
  /** Human-readable location on the listing */
  location_name?: string | null;
  /** Rating average if available */
  rating?: number | null;
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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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
  const freshness = timeAgo(product.updated_at || null);
  const isBoosted = product.boosted === true;
  const isAvailable = product.shop.available_now !== false;
  const trustScore = product.shop.trust_score ?? null;

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
          {/* Boosted badge */}
          {isBoosted ? (
            <div className="absolute left-1.5 top-1.5 z-[6] inline-flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm leading-none">
              <MaterialSymbol name="bolt" className="!text-[11px] leading-none" />
              Boosted
            </div>
          ) : null}

          {/* Freshness badge */}
          {freshness ? (
            <div className="absolute right-1.5 top-1.5 z-[6] inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm leading-none">
              {freshness}
            </div>
          ) : null}

          {/* View count */}
          {viewCount !== null ? (
            <div className="absolute bottom-1.5 right-1.5 z-[6] inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm leading-none">
              <MaterialSymbol name="visibility" className="!text-[11px] leading-none" />
              {viewCount}
            </div>
          ) : null}

          {/* Hover overlay with shop details */}
          {!inShop ? (
            <div
              className="pointer-events-none absolute inset-0 z-[5] flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover:opacity-100"
              aria-hidden
            >
              <div className="space-y-1 px-3 pb-3">
                <p className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {product.title}
                </p>
                <p className="text-[11px] text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {product.shop.name}
                  {product.shop.verified ? " ✓" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/70 px-1.5 py-0.5 text-[9px] font-medium text-white leading-none">
                      <span className="size-1.5 rounded-full bg-white" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground/40 px-1.5 py-0.5 text-[9px] font-medium text-white/80 leading-none">
                      Unavailable
                    </span>
                  )}
                  {product.location_name ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-medium text-white leading-none">
                      <MaterialSymbol name="location_on" className="!text-[9px] leading-none" />
                      {product.location_name}
                    </span>
                  ) : null}
                  {trustScore !== null && trustScore > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/60 px-1.5 py-0.5 text-[9px] font-medium text-white leading-none">
                      ★ {trustScore.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* In-shop description hover */}
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

        <div className="flex items-center gap-1.5">
          {product.sellerId && (
            <MessageSellerButton
              sellerId={product.sellerId}
              shopId={product.shop.id}
              productId={product.id}
              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-[10px]"
            />
          )}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`dm-focus inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-semibold text-white transition-[filter] hover:brightness-95 ${
                product.sellerId ? "shrink-0" : "w-full"
              }`}
            >
              <WhatsAppIcon className="size-3 shrink-0 text-white" />
              {!product.sellerId && "WhatsApp"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
