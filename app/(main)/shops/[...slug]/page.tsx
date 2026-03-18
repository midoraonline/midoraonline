import ProductCard, { ProductCardData } from "@/components/productcard";
import ShopChat from "@/components/shopChat";
import { apiProducts, apiShops } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ShopDetails({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  let shop: Awaited<ReturnType<typeof apiShops.bySlug>> | null = null;
  let items: ProductCardData[] = [];

  try {
    shop = await apiShops.bySlug(slugValue);
  } catch {
    shop = null;
  }

  if (!shop) return notFound();

  try {
    const { items: products } = await apiProducts.listShopProducts(shop.id);
    items = products.map((p) => ({
      id: p.id,
      slug: p.id, // backend currently exposes id, not slug
      title: p.title,
      priceUGX: p.price ?? 0,
      imageUrl: p.image_url ?? undefined,
      shop: {
        id: shop!.id,
        name: shop!.name,
        slug: shop!.slug,
        verified: shop!.is_active ?? true,
      },
    }));
  } catch {
    items = [];
  }

  const temporarilyClosed = shop.is_active === false;

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {shop.name}
              </h1>
              {shop.is_active ? (
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground/80">
                  Verified
                </span>
              ) : null}
              {temporarilyClosed ? (
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-semibold text-foreground/75">
                  Temporarily Closed
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-muted">
              {shop.description ?? "This shop is powered by Midora Online."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                {shop.category ?? "Shop"}
              </span>
              <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80">
                {typeof shop.location === "string"
                  ? shop.location
                  : shop.location && typeof shop.location === "object" && "display" in shop.location
                    ? String((shop.location as { display?: string }).display ?? "Online")
                    : "Online"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="dm-pill dm-focus border border-border bg-surface hover:bg-foreground/5"
              disabled
            >
              Follow (soon)
            </button>
            <Link
              href={`/chat?shop_id=${encodeURIComponent(shop.id)}`}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity"
            >
              Chat (agent)
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="dm-card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">
            Shop products
          </h2>
          <p className="mt-1 text-sm text-muted">
            Browse items from this shop.
          </p>
        </div>
        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">Shop info</h2>
          <p className="mt-2 text-sm text-muted">
            Policies, returns, and contact details will appear here.
          </p>
          <div className="mt-4">
            <Link
              className="text-sm font-semibold text-foreground/80 hover:text-foreground dm-focus rounded-xl px-2 py-1"
              href="/policies"
            >
              View platform policies
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            In-shop concierge (Gemini)
          </h2>
          <p className="mt-2 text-sm text-muted">
            Ask anything about {shop.name}&apos;s products, availability, or policies.
          </p>
          <p className="mt-1 text-xs text-muted">
            Answers are generated from Midora Online&apos;s understanding of this shop.
          </p>
        </div>
        <ShopChat shopId={shop.id} shopName={shop.name} />
      </section>
    </div>
  );
}