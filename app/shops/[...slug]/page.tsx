import Link from "next/link";
import { notFound } from "next/navigation";
import EditShopForm from "@/components/shop/EditShopForm";
import ShopAnalyticsPage from "@/components/shop/ShopAnalyticsPage";
import ShopProductGridRealtime from "@/components/shop/ShopProductGridRealtime";
import ShopTabs from "@/components/shop/ShopTabs";
import ShopReviews from "@/components/shop/ShopReviews";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { locationDisplay } from "@/components/shop/shopUtils";
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
  const publishedCount = items.filter((p) => p.is_published !== false).length;

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

  const location = locationDisplay(shop.location);
  const socials = shop.social_links?.filter((s) => s.url?.trim()) ?? [];
  const hasContactBody =
    Boolean(shop.shop_email?.trim()) ||
    Boolean(shop.whatsapp_number?.trim()) ||
    extraContacts.length > 0 ||
    socials.length > 0 ||
    Boolean(location) ||
    Boolean(shop.availability?.days || shop.availability?.hours);

  const productsSection = (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-3 sm:mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          {shop.shop_type === "service" ? "Services" : "All listings"}
        </h2>
        {publishedCount > 0 ? (
          <p className="shrink-0 text-xs tabular-nums text-muted sm:text-sm">
            {publishedCount}
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
          trust_badges: shop.trust_badges ?? null,
        }}
        initialProducts={items}
      />
    </>
  );

  const aboutSection = showAboutSection ? (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
        About {shop.name}
      </h2>
      <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {about}
      </p>
    </div>
  ) : null;

  const contactsSection = hasContactBody ? (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
        Contact
      </h2>
      <ul className="max-w-lg space-y-3 text-sm">
        {shop.whatsapp_number?.trim() ? (
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              WhatsApp
            </span>
            <span className="min-w-0 break-words text-foreground">
              {shop.whatsapp_number}
            </span>
          </li>
        ) : null}
        {shop.shop_email?.trim() ? (
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              Email
            </span>
            <a
              href={`mailto:${shop.shop_email.trim()}`}
              className="min-w-0 break-words text-accent hover:underline"
            >
              {shop.shop_email.trim()}
            </a>
          </li>
        ) : null}
        {location ? (
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              Location
            </span>
            <span className="min-w-0 break-words text-foreground">{location}</span>
          </li>
        ) : null}
        {shop.availability?.days || shop.availability?.hours ? (
          <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              Hours
            </span>
            <span className="min-w-0 break-words text-foreground">
              {[shop.availability.days, shop.availability.hours]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </li>
        ) : null}
        {extraContacts.map((c, i) => (
          <li
            key={i}
            className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              {c.label ?? c.type ?? "Contact"}
            </span>
            <span className="min-w-0 break-words text-foreground">{c.value}</span>
          </li>
        ))}
        {socials.map((s, i) => (
          <li
            key={`social-${i}`}
            className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
              {s.platform ?? "Social"}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 break-all text-accent hover:underline"
            >
              {s.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const conciergeSection = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: "var(--info-subtle)", color: "var(--info)" }}
          aria-hidden="true"
        >
          <MaterialSymbol name="smart_toy" className="!text-xl" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            Need help?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Ask the {shop.name} AI concierge about products, pricing, availability
            or delivery. Use the chat button in the bottom-right to start.
          </p>
        </div>
      </div>
      <Link href="/policies" className="dm-btn dm-btn-primary">
        View platform policies
      </Link>
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
