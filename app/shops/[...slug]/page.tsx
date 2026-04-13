import ProductCard, { ProductCardData } from "@/components/productcard";
import { apiProducts, apiShops } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditShopForm from "@/components/shop/EditShopForm";

export default async function ShopDetails({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const isEditRoute = Array.isArray(slug) && slug[1] === "edit";

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
    <div className="space-y-8">
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

      {showAboutSection ? (
        <section className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            About {shop.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{about}</p>
        </section>
      ) : null}

      {extraContacts.length > 0 ? (
        <section className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            More contact details
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
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

      <section className="dm-card bg-primary/[0.02] p-6">
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
        <p className="mt-4">
          <Link
            href="/policies"
            className="inline-flex rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground dm-focus"
          >
            View platform policies
          </Link>
        </p>
      </section>
    </div>
  );
}
