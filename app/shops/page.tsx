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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="dm-container py-8">
          <div className="space-y-6">
            <div className="dm-card p-6 sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Mall Map
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    Browse shops by category or location. Brands come first.
                  </p>
                </div>
                <div className="grid w-full gap-3 md:max-w-xl md:grid-cols-3">
                  <input
                    className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
                    placeholder="Search shops…"
                  />
                  <select className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus">
                    <option>All categories</option>
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Groceries</option>
                    <option>Home Care</option>
                  </select>
                  <select className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus">
                    <option>All locations</option>
                    <option>Kampala</option>
                    <option>Downtown</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
