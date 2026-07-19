import Image from "next/image";

/**
 * Circular shop avatar with an optional floating verified checkmark badge
 * (Instagram / TikTok convention). Used in both immersive and plain hero
 * variants. When no logo is set, falls back to the Midora storefront mark.
 */
export default function ShopIdentityAvatar({
  logoUrl,
  name,
  verified,
  immersive,
}: {
  logoUrl?: string | null;
  name: string;
  verified: boolean;
  immersive: boolean;
}) {
  const ringClass = immersive
    ? "ring-4 ring-white/40"
    : "ring-4 ring-white shadow-md";

  return (
    <div className={`relative size-24 shrink-0 overflow-visible sm:size-28`}>
      <div className={`relative size-full overflow-hidden rounded-full ${ringClass}`}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            fill
            className="object-cover"
            priority
            sizes="112px"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Midora Online"
            fill
            className="object-contain p-3"
            priority
            sizes="112px"
          />
        )}
      </div>
      {verified ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full text-white shadow-md ring-2 ring-white sm:size-8"
          style={{ background: "var(--primary)" }}
          aria-label="Verified shop"
          title="Verified shop"
        >
          <span
            className="material-symbols-outlined !text-[16px] sm:!text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
        </span>
      ) : null}
    </div>
  );
}
