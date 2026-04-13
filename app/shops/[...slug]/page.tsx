import ProductCard, { ProductCardData } from "@/components/productcard";
import { apiProducts, apiShops } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditShopForm from "@/components/shop/EditShopForm";
import ShopAnalyticsPage from "@/components/shop/ShopAnalyticsPage";

export default async function ShopDetails({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const isEditRoute = Array.isArray(slug) && slug[1] === "edit";
  const isAnalyticsRoute = Array.isArray(slug) && slug[1] === "analytics";

  let shop: Awaited<ReturnType<typeof apiShops.bySlug>> | null = null;
  let items: ProductCardData[] = [];

  try {
    shop = await apiShops.bySlug(slugValue);
  } catch {
    shop = null;
  }

  if (!shop) return notFound();

  if (isEditRoute) {
    return <EditShopForm shop={shop} />;
  }

  if (isAnalyticsRoute) {
    return <ShopAnalyticsPage shop={shop} />;
  }

  try {
    const { items: products } = await apiProducts.listShopProducts(shop.id);
    items = products.map((p) => ({
      id: p.id,
      slug: p.id,
      title: p.title,
      priceUGX: apiProducts.productPriceUgx(p),
      imageUrl: apiProducts.productPrimaryImage(p),
      shopLogoUrl: shop!.logo_url ?? undefined,
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

  const desc = (shop.description ?? "").trim();
  const about = (shop.about ?? "").trim();
  const showAboutSection = Boolean(about && about !== desc);

  const emailNorm = shop.shop_email?.trim().toLowerCase() ?? "";
  const waNorm = shop.whatsapp_number?.replace(/\D/g, "") ?? "";
  const extraContacts =
    shop.contacts?.filter((c) => {
      const v = c.value.trim();
      if (emailNorm && v.toLowerCase() === emailNorm) return false;
      if (waNorm && v.replace(/\D/g, "") === waNorm) return false;
      return true;
    }) ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section id="shop-products" className="scroll-mt-28 sm:scroll-mt-32">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Products &amp; Services
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {items.length > 0
              ? `${items.length} item${items.length === 1 ? "" : "s"} from ${shop.name}`
              : `${shop.name} hasn't listed any items yet.`}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="dm-card p-8 text-center sm:p-10">
            <p className="text-sm text-muted">
              No products listed yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {showAboutSection ? (
        <section id="shop-about" className="dm-card scroll-mt-28 p-6 sm:scroll-mt-32 sm:p-8">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            About {shop.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{about}</p>
        </section>
      ) : null}

      {extraContacts.length > 0 ? (
        <section id="shop-contacts" className="dm-card scroll-mt-28 p-6 sm:scroll-mt-32 sm:p-8">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            More contact details
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {extraContacts.map((c, i) => (
              <li key={i} className="text-foreground/90">
                <span className="text-muted capitalize">
                  {c.label ?? c.type ?? "Contact"}:{" "}
                </span>
                {c.value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="shop-concierge" className="dm-card scroll-mt-28 p-6 sm:scroll-mt-32 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          Have a question?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Ask the {shop.name} AI concierge about products, pricing, availability
          or delivery — it&apos;s powered by Midora Online and ready to help.
        </p>
        <p className="mt-3 text-xs text-muted">
          Use the chat button in the bottom-right corner to get started.
        </p>
        <p className="mt-6">
          <Link
            href="/policies"
            className="dm-pill dm-focus inline-flex bg-foreground/[0.07] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            View platform policies
          </Link>
        </p>
      </section>
    </div>
  );
}
