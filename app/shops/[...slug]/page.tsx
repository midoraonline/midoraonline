import Link from "next/link";
import { notFound } from "next/navigation";
import EditShopForm from "@/components/shop/EditShopForm";
import ShopAnalyticsPage from "@/components/shop/ShopAnalyticsPage";
import ShopProductGridRealtime from "@/components/shop/ShopProductGridRealtime";
import ShopTabs from "@/components/shop/ShopTabs";
import ShopReviews from "@/components/shop/ShopReviews";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { getShopBySlug, listShopProducts } from "@/lib/api/server";

export default async function ShopDetails({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const isEditRoute = Array.isArray(slug) && slug[1] === "edit";
  const isAnalyticsRoute = Array.isArray(slug) && slug[1] === "analytics";

  const shop = await getShopBySlug(slugValue);

  if (!shop) return notFound();

  if (isEditRoute) {
    return <EditShopForm shop={shop} />;
  }

  if (isAnalyticsRoute) {
    return <ShopAnalyticsPage shop={shop} />;
  }

  const items = await listShopProducts(shop.id);

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

  const productsSection = (
    <>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {shop.shop_type === "service" ? "Services" : "Inventory"}
          </p>
          <h2 className="font-display mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Current listings
          </h2>
        </div>
        {items.length > 0 ? (
          <p className="shrink-0 text-xs text-muted sm:text-sm">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          {shop.name} hasn&apos;t listed any items yet.
        </p>
      ) : null}

      <ShopProductGridRealtime
        shop={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          verified: shop.is_active ?? true,
          logoUrl: shop.logo_url ?? null,
          whatsappNumber: shop.whatsapp_number ?? null,
          category: shop.category ?? null,
          ownerId: shop.owner_id ?? null,
        }}
        initialProducts={items}
      />
    </>
  );

  const aboutSection = showAboutSection ? (
    <div className="dm-card p-6 sm:p-8">
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">
        About {shop.name}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{about}</p>
    </div>
  ) : null;

  const contactsSection =
    extraContacts.length > 0 ? (
      <div className="dm-card p-6 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          More contact details
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm">
          {extraContacts.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground">
              <span className="text-xs font-medium capitalize text-muted">
                {c.label ?? c.type ?? "Contact"}:
              </span>
              <span className="min-w-0 break-words">{c.value}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const conciergeSection = (
    <div className="dm-card p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: "var(--info-subtle)", color: "var(--info)" }}
          aria-hidden="true"
        >
          <MaterialSymbol name="smart_toy" className="!text-xl" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Have a question?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Ask the {shop.name} AI concierge about products, pricing, availability
            or delivery. Tap the chat button in the bottom-right to start.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <Link href="/policies" className="dm-btn dm-btn-primary">
          View platform policies
        </Link>
      </div>
    </div>
  );

  return (
    <ShopTabs
      products={productsSection}
      about={aboutSection}
      contacts={contactsSection}
      reviews={<ShopReviews shopId={shop.id} />}
      concierge={conciergeSection}
      shopSlug={shop.slug}
      shopId={shop.id}
    />
  );
}
