"use client";

import Link from "next/link";
import { useAtomValue } from "jotai/react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { sessionAtom } from "@/lib/state";
import type { ShopQuickNavFlags } from "./shopUtils";

const pill =
  "inline-flex items-center justify-center rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1.5 text-xs font-semibold text-foreground/85 transition-colors hover:bg-foreground/[0.08] dm-focus sm:text-sm";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ShopHeroToolbar({
  shopId,
  shopSlug,
  quickNav,
}: {
  shopId: string;
  shopSlug: string;
  quickNav: ShopQuickNavFlags;
}) {
  const session = useAtomValue(sessionAtom);
  const isOwner = session.ownedShopIds.includes(shopId);

  const hasAnyNav =
    quickNav.products ||
    quickNav.about ||
    quickNav.contacts ||
    quickNav.concierge;

  if (!hasAnyNav && !isOwner) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
      {quickNav.products ? (
        <button type="button" className={pill} onClick={() => scrollToSection("shop-products")}>
          Products
        </button>
      ) : null}
      {quickNav.about ? (
        <button type="button" className={pill} onClick={() => scrollToSection("shop-about")}>
          About
        </button>
      ) : null}
      {quickNav.contacts ? (
        <button type="button" className={pill} onClick={() => scrollToSection("shop-contacts")}>
          Contacts
        </button>
      ) : null}
      {quickNav.concierge ? (
        <button type="button" className={pill} onClick={() => scrollToSection("shop-concierge")}>
          Help
        </button>
      ) : null}
      {isOwner ? (
        <Link
          href={`/shops/${shopSlug}/analytics`}
          className={`${pill} border-primary/25 bg-primary/12 text-primary hover:bg-primary/18`}
          aria-label="Shop analytics"
          title="Shop analytics"
        >
          <MaterialSymbol name="analytics" className="!text-[18px] leading-none sm:!text-[20px]" />
          <span className="ml-1.5 hidden sm:inline">Analytics</span>
        </Link>
      ) : null}
    </div>
  );
}
