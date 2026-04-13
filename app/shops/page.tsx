import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import ShopCard from "@/components/shopcard";
import { apiShops } from "@/lib/api";

function locationDisplay(loc: unknown): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

export default async function ShopListing() {
  let shops: Awaited<ReturnType<typeof apiShops.listPublic>>["items"] = [];

  try {
    const data = await apiShops.listPublic();
    shops = data.items;
  } catch {
    shops = [];
  }

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

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={{
                    id: shop.id,
                    slug: shop.slug,
                    name: shop.name,
                    category: shop.category ?? "Shop",
                    location: locationDisplay(shop.location),
                    tagline: shop.description ?? "",
                    verified: shop.is_active ?? true,
                    logoUrl: shop.logo_url ?? null,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}
