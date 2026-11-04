import Image from "next/image";
import Link from "next/link";

function logoUnopt(src: string) {
  return /ufs\.sh|utfs\.io/i.test(src) || /\.svg(\?|$)/i.test(src);
}

export default function ProductShopLogoOverlay({
  shopName,
  logoUrl,
  shopHref,
  className = "",
}: {
  shopName: string;
  logoUrl?: string | null;
  shopHref?: string;
  className?: string;
}) {
  if (!logoUrl) return null;
  const inner = (
    <Image
      src={logoUrl}
      alt={`${shopName} logo`}
      width={44}
      height={44}
      className="size-11 object-cover"
      unoptimized={logoUnopt(logoUrl)}
    />
  );

  const shell =
    "absolute right-2 top-2 z-10 flex size-11 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-md ring-1 ring-black/10 backdrop-blur-sm " +
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
