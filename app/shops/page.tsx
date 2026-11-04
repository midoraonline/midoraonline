import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopsBrowsePage from "@/components/shop/ShopsBrowsePage";
import { listPublicShopsPage } from "@/lib/api/server";
import { loadShopProductCategoryMap } from "@/lib/productFeed";
import { SHOPS_PAGE_SIZE } from "@/lib/api/shops";
import { Mail, MapPin } from "lucide-react";

export const revalidate = 60;

export default async function ShopListing() {
  let shops: Awaited<ReturnType<typeof listPublicShopsPage>>["items"] = [];
  let shopProductCategories: Record<string, string[]> = {};
  let hasMore = false;
  let total: number | null = null;

  try {
    const page = await listPublicShopsPage({ page: 1, limit: SHOPS_PAGE_SIZE });
    shops = page.items ?? [];
    hasMore = Boolean(page.has_more ?? shops.length >= SHOPS_PAGE_SIZE);
    total = page.total ?? null;
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

      <main className="flex-1">
        <div className="dm-container pt-4 pb-2 sm:pt-5 sm:pb-3 lg:pt-6 lg:pb-4">
          <ShopsBrowsePage
            initialShops={shops}
            initialHasMore={hasMore}
            initialTotal={total}
            shopProductCategories={shopProductCategories}
          />
        </div>
      </main>
      <Footer />
      <MidoraInfoChatWidget aboveBottomNav />
    </div>
  );
}
