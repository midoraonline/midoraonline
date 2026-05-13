import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopsBrowsePage from "@/components/shop/ShopsBrowsePage";
import { listPublicShops } from "@/lib/api/server";

export const revalidate = 60;

export default async function ShopListing() {
  const shops = await listPublicShops();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-[5.25rem] sm:pt-[5.75rem]">
        <div className="dm-container py-5 sm:py-8 lg:py-10">
          <ShopsBrowsePage initialShops={shops} />
        </div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}
