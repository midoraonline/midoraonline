import Image from "next/image";
import Link from "next/link";

function logoUnopt(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

/**
 * Shop branding on the product image — top-right. Use `shopHref` on detail pages (link to shop);
 * omit on cards so the card’s product link stays the only click target.
 */
export default function ProductShopLogoOverlay({
  shopName,
  logoUrl,
  shopHref,
  className = "",
}: {
  shopName: string;
  logoUrl?: string | null;
  /** When set, logo is a link to the shop (e.g. product detail hero). */
  shopHref?: string;
  className?: string;
}) {
  const inner = (
    <>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${shopName} logo`}
          width={44}
          height={44}
          className="size-11 object-cover"
          unoptimized={logoUnopt(logoUrl)}
        />
      ) : (
        <span className="grid size-11 place-items-center text-[11px] font-bold text-foreground/45">
          {shopName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </>
  );

  const shell =
    "absolute right-2 top-2 z-10 flex size-11 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-md ring-1 ring-black/10 backdrop-blur-sm dark:bg-black/50 dark:ring-white/15 " +
    className;

  if (shopHref) {
    return (
      <Link
        href={shopHref}
        className={`${shell} dm-focus transition-opacity hover:opacity-95`}
        title={`${shopName} — view shop`}
        aria-label={`View ${shopName} shop`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${shell} pointer-events-none`} aria-hidden>
      {inner}
    </div>
  );
}
