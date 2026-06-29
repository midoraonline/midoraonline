export const dynamic = "force-dynamic";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopsBrowsePage from "@/components/shop/ShopsBrowsePage";
import { listPublicShops } from "@/lib/api/server";
import { loadShopProductCategoryMap } from "@/lib/productFeed";
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
      <div className="border-b border-border bg-surface/80">
        <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
          <div className="hidden items-center gap-4 text-xs text-muted sm:flex">
            <a
              href="mailto:midoraonline@gmail.com"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent" />
              Kampala, Uganda
            </span>
          </div>
          <div className="text-xs text-muted">
            Rent a shop for{" "}
            <span className="font-semibold text-foreground">5,000 UGX/month</span>
          </div>
        </div>
      </div>
      <Navbar />
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
