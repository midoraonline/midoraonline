import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Mail, MapPin } from "lucide-react";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopHeroActionBar from "@/components/shop/ShopHeroActionBar";
import ShopPageEffects from "@/components/shop/ShopPageEffects";
import ShopChatWidget from "@/components/shopChatWidget";
import { locationDisplay } from "@/components/shop/shopUtils";
import { getShopBySlug, getShopBySlugForMetadata, listShopProducts } from "@/lib/api/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  // Soft-fail on upstream 5xx so metadata blips don't crash the RSC tree.
  const shop = await getShopBySlugForMetadata(slugParts[0] ?? "");

  if (!shop) return { title: "Shop | Midora Online" };

  if (slugParts[1] === "analytics") {
    return {
      title: `Analytics — ${shop.name} | Midora Online`,
      description: `Engagement and product stats for ${shop.name} on Midora Online.`,
    };
  }

  const title = `${shop.name} | Midora Online`;
  const description =
    shop.description ??
    shop.about ??
    `Discover ${shop.name} on Midora Online — brand-first shopping across Africa.`;
  const url = `https://www.midoraonline.com/shops/${shop.slug}`;
  const images = shop.logo_url
    ? [{ url: shop.logo_url, alt: shop.name }]
    : [{ url: "https://www.midoraonline.com/logo.png", alt: "Midora Online" }];

  return {
    title,
    description,
    keywords: [
      shop.name,
      shop.category ?? "",
      locationDisplay(shop.location),
      "Midora Online",
      "Uganda",
      "online shop",
      "Africa",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Midora Online",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    alternates: { canonical: url },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const shop = await getShopBySlug(slugParts[0] ?? "");

  if (!shop) notFound();

  const subPage = slugParts[1];
  const isEditRoute = subPage === "edit";
  const isAnalyticsRoute = subPage === "analytics";
  const isManagementRoute = isEditRoute || isAnalyticsRoute;
  const skipShopViewPing = isManagementRoute;

  // Fetch products for the hero carousel (same React.cache call as the page —
  // no extra network round-trip is made). Management routes don't need them.
  const heroProducts = !isManagementRoute ? await listShopProducts(shop.id) : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {!skipShopViewPing ? <ShopPageEffects shopId={shop.id} /> : null}
      {!isManagementRoute ? (
        <div className="border-b border-border bg-surface/80">
          <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
            <div className="hidden items-center gap-4 text-xs text-muted sm:flex">
              <a
                href="mailto:midoraonline@gmail.com"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="size-3.5 text-accent" />
                midoraonline@gmail.com
              </a>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-accent" />
                Kampala, Uganda
              </span>
            </div>
            <div className="text-xs text-muted">
              Rent a shop for{" "}
              <span className="font-semibold text-foreground">5,000 UGX/month</span>
            </div>
          </div>
        </div>
      ) : null}
      <Navbar shopLogoUrl={shop.logo_url} shopName={shop.name} />
      {!isManagementRoute ? (
        <>
          <ShopHeader
            shop={shop}
            products={heroProducts}
            backHref="/shops"
            backLabel="All shops"
          />
          <ShopHeroActionBar
            shopId={shop.id}
            shopSlug={shop.slug}
            shopName={shop.name}
            shopLogoUrl={shop.logo_url}
          />
        </>
      ) : null}
      <main className="flex-1">
        <div className="dm-container pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12">
          {children}
        </div>
      </main>
      <Footer />
      {!isManagementRoute ? (
        <ShopChatWidget shopId={shop.id} shopName={shop.name} />
      ) : null}
    </div>
  );
}
