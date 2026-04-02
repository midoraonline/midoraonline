import ProductCard, { ProductCardData } from "@/components/productcard";
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
      slug: p.id,
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

  return (
    <div className="space-y-8">
      {/* products */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Products &amp; Services
          </h2>
          <p className="mt-1 text-sm text-muted">
            {items.length > 0
              ? `${items.length} item${items.length === 1 ? "" : "s"} from ${shop.name}`
              : `${shop.name} hasn't listed any items yet.`}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="dm-card p-8 text-center">
            <p className="text-sm text-muted">
              No products listed yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* about + info */}
      {(shop.about ?? shop.description) && (
        <section className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            About {shop.name}
          </h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {shop.about ?? shop.description}
          </p>
        </section>
      )}

      {/* shop info */}
      <section className="dm-card p-6">
        <h2 className="text-base font-semibold tracking-tight">Shop info</h2>
        <div className="mt-4 space-y-3 text-sm">
          {shop.availability?.days && (
            <div className="flex gap-3">
              <span className="w-28 shrink-0 text-muted">Open days</span>
              <span className="text-foreground/90">{shop.availability.days}</span>
            </div>
          )}
          {shop.availability?.hours && (
            <div className="flex gap-3">
              <span className="w-28 shrink-0 text-muted">Hours</span>
              <span className="text-foreground/90">
                {shop.availability.hours}
              </span>
            </div>
          )}
          {shop.shop_email && (
            <div className="flex gap-3">
              <span className="w-28 shrink-0 text-muted">Email</span>
              <a
                href={`mailto:${shop.shop_email}`}
                className="text-foreground/90 hover:text-foreground transition-colors"
              >
                {shop.shop_email}
              </a>
            </div>
          )}
          {shop.whatsapp_number && (
            <div className="flex gap-3">
              <span className="w-28 shrink-0 text-muted">WhatsApp</span>
              <a
                href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/90 hover:text-foreground transition-colors"
              >
                {shop.whatsapp_number}
              </a>
            </div>
          )}
          {shop.contacts?.map((c, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-28 shrink-0 text-muted capitalize">
                {c.label ?? c.type ?? "Contact"}
              </span>
              <span className="text-foreground/90">{c.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border/60">
          <Link
            className="text-sm font-medium text-foreground/80 hover:text-foreground dm-focus rounded-xl px-2 py-1 transition-colors"
            href="/policies"
          >
            View platform policies →
          </Link>
        </div>
      </section>

      {/* concierge prompt */}
      <section className="dm-card p-6 bg-foreground/[0.02]">
        <h2 className="text-base font-semibold tracking-tight">
          Have a question?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Ask the {shop.name} AI concierge about products, pricing, availability
          or delivery — it&apos;s powered by Midora Online and ready to help.
        </p>
        <p className="mt-3 text-xs text-muted">
          Use the chat button in the bottom-right corner to get started.
        </p>
      </section>
    </div>
  );
}
