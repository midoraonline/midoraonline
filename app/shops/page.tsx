export const dynamic = "force-dynamic";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopsBrowsePage from "@/components/shop/ShopsBrowsePage";
import { listPublicShops } from "@/lib/api/server";
import { loadShopProductCategoryMap } from "@/lib/productFeed";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";

export default async function ShopListing() {
  let shops: Awaited<ReturnType<typeof listPublicShops>> = [];
  let shopProductCategories: Record<string, string[]> = {};

  try {
    shops = await listPublicShops();
    shopProductCategories = await loadShopProductCategoryMap(shops.map((s) => s.id));
  } catch (e) {
    console.error("Failed to load shops browse page", e);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar — scrolls away naturally */}
      <div className="border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
          <div className="hidden items-center gap-4 text-xs text-white/75 sm:flex">
            <a
              href="mailto:midoraonline@gmail.com"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent" />
              Kampala, Uganda
            </span>
          </div>
          <div className="text-xs text-white/80">
            Rent a shop for{" "}
            <span className="font-semibold text-accent">5,000 UGX/month</span>
          </div>
        </div>
      </div>
      <Navbar />

      {/* Hero banner */}
      <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden">
        <Image src="/shops_banner.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
        <div className="relative z-10 flex h-full flex-col justify-center dm-container">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Discover</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Browse Shops
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75">
            Find verified local sellers across Uganda — from crafts to fashion, food to tech.
          </p>
        </div>
      </div>

      <main className="flex-1">
        <div className="dm-container py-5 sm:py-8 lg:py-10">
          <ShopsBrowsePage initialShops={shops} shopProductCategories={shopProductCategories} />
        </div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}
