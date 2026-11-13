"use client";

import Image from "next/image";
import { PiArrowsLeftRightBold, PiSquaresFourFill } from "react-icons/pi";

const SIZES = {
  xs: { box: "size-5 rounded-full text-[9px]", px: 20, icon: "size-3" },
  sm: { box: "size-8 rounded-lg text-[11px]", px: 32, icon: "size-4" },
  md: { box: "size-10 rounded-lg text-xs", px: 40, icon: "size-5" },
  lg: { box: "size-12 rounded-xl text-sm", px: 48, icon: "size-6" },
} as const;

type Size = keyof typeof SIZES;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const text = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2);
  return text.toUpperCase() || "·";
}

/** Shop logo, initials on the accent tint, or (shop = null) the "Other listings" mark. */
export function ShopAvatar({
  shop,
  size = "md",
}: {
  shop: { name: string; logo_url?: string | null } | null;
  size?: Size;
}) {
  const s = SIZES[size];
  if (!shop) {
    return (
      <span
        className={`grid shrink-0 place-items-center border border-dashed border-border-input bg-surface-subtle text-muted ${s.box}`}
        aria-hidden
      >
        <PiSquaresFourFill className={s.icon} />
      </span>
    );
  }
  if (shop.logo_url) {
    return (
      <Image
        src={shop.logo_url}
        alt=""
        width={s.px}
        height={s.px}
        className={`shrink-0 object-cover ring-1 ring-border ${s.box}`}
      />
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center bg-accent/10 font-semibold text-accent ${s.box}`} aria-hidden>
      {initials(shop.name)}
    </span>
  );
}

const CHIP =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium";

/** Which shop a listing is in. With `onMove` it doubles as the move shortcut. */
export function ShopChip({
  shop,
  otherLabel,
  onMove,
}: {
  shop: { name: string; logo_url?: string | null } | null;
  otherLabel: string;
  onMove?: () => void;
}) {
  const tone = shop
    ? "border-border bg-surface-subtle text-foreground"
    : "border-dashed border-border-input bg-surface text-muted";
  const body = (
    <>
      <ShopAvatar shop={shop} size="xs" />
      <span className="truncate">{shop ? shop.name : otherLabel}</span>
    </>
  );
  if (!onMove) return <span className={`${CHIP} ${tone}`}>{body}</span>;
  return (
    <button
      type="button"
      onClick={onMove}
      title="Move to another shop"
      className={`dm-focus group ${CHIP} ${tone} transition-colors hover:border-accent/60 hover:text-foreground`}
    >
      {body}
      <PiArrowsLeftRightBold className="size-3 shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden />
      <span className="sr-only">Move to another shop</span>
    </button>
  );
}
