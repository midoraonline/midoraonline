import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopListRealtime from "@/components/shop/ShopListRealtime";
import { listPublicShops } from "@/lib/api/server";

/** Shop directory is fully dynamic so newly-activated shops show up instantly. */
export const dynamic = "force-dynamic";

export default async function ShopListing() {
  const shops = await listPublicShops();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-[5.25rem] sm:pt-[5.75rem]">
        <div className="dm-container py-5 sm:py-8 lg:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
            <div className="dm-card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Shop List
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    Browse shops by category or location.
                  </p>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3">
                  <input className="dm-input sm:col-span-2 lg:col-span-1" placeholder="Search shops…" />
                  <select className="dm-input appearance-none pr-10">
                    <option>All categories</option>
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Groceries</option>
                    <option>Home Care</option>
                  </select>
                  <select className="dm-input appearance-none pr-10 sm:col-span-2 lg:col-span-1">
                    <option>All locations</option>
                    <option>Kampala</option>
                    <option>Downtown</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>
            </div>

            <ShopListRealtime initialShops={shops} />
          </div>
        </div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}
