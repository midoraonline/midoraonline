"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";
import type { ShopQuickNavFlags } from "./shopUtils";

export type ShopHeroToolbarTone = "immersive" | "plain";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ShopHeroToolbar({
  shopId,
  shopSlug,
  quickNav,
  tone = "immersive",
}: {
  shopId: string;
  shopSlug: string;
  quickNav: ShopQuickNavFlags;
  /** `immersive`: styled for photo hero (CSS vars). `plain`: surface / primary pills. */
  tone?: ShopHeroToolbarTone;
}) {
  const session = useAppSession();
  const canManage = canManageShopStorefront(session, shopId);

  const hasAnyNav =
    quickNav.products ||
    quickNav.about ||
    quickNav.contacts ||
    quickNav.concierge;

  if (!hasAnyNav && !canManage) return null;

  const immersiveStyle: CSSProperties =
    tone === "immersive"
      ? {
          borderColor: "var(--hero-chip-border)",
          background: "var(--hero-chip-bg)",
          color: "var(--hero-text-strong)",
        }
      : {};

  const navPillBase =
    tone === "immersive"
      ? "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition duration-200 dm-focus sm:text-sm hover:brightness-110"
      : "inline-flex items-center justify-center rounded-full border border-foreground/[0.1] bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-sm transition-colors hover:bg-foreground/[0.1] dm-focus sm:text-sm";

  const analyticsClass =
    tone === "immersive"
      ? "inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/35 bg-primary/18 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-[filter] hover:brightness-110 dm-focus sm:text-sm"
      : "inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/14 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/20 dm-focus sm:text-sm";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
      {quickNav.products ? (
        <button
          type="button"
          className={navPillBase}
          style={tone === "immersive" ? immersiveStyle : undefined}
          onClick={() => scrollToSection("shop-products")}
        >
          Products
        </button>
      ) : null}
      {quickNav.about ? (
        <button
          type="button"
          className={navPillBase}
          style={tone === "immersive" ? immersiveStyle : undefined}
          onClick={() => scrollToSection("shop-about")}
        >
          About
        </button>
      ) : null}
      {quickNav.contacts ? (
        <button
          type="button"
          className={navPillBase}
          style={tone === "immersive" ? immersiveStyle : undefined}
          onClick={() => scrollToSection("shop-contacts")}
        >
          Contacts
        </button>
      ) : null}
      {quickNav.concierge ? (
        <button
          type="button"
          className={navPillBase}
          style={tone === "immersive" ? immersiveStyle : undefined}
          onClick={() => scrollToSection("shop-concierge")}
        >
          Help
        </button>
      ) : null}
      {canManage ? (
        <Link
          href={`/shops/${shopSlug}/analytics`}
          className={analyticsClass}
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
