import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopsBrowsePage from "@/components/shop/ShopsBrowsePage";
import { listPublicShops } from "@/lib/api/server";
import { loadShopProductCategoryMap } from "@/lib/productFeed";
import { Mail, MapPin } from "lucide-react";

export default async function ShopListing() {
  const shops = await listPublicShops();
  const shopProductCategories = await loadShopProductCategoryMap(shops.map((s) => s.id));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar — scrolls away naturally */}
      <div className="border-b border-border bg-surface/80">
        <div className="dm-container flex h-9 items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted">
            <a
              href="mailto:midoraonline@gmail.com"
              className="hidden items-center gap-1.5 transition-colors hover:text-foreground sm:inline-flex"
            >
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </a>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
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
