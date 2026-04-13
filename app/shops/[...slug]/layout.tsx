import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFooter from "@/components/shop/ShopFooter";
import ShopPageEffects from "@/components/shop/ShopPageEffects";
import ShopChatWidget from "@/components/shopChatWidget";
import {
  locationDisplay,
  shopQuickNavFlags,
  type ShopQuickNavFlags,
} from "@/components/shop/shopUtils";

async function fetchShop(slug: string): Promise<Shop | null> {
  try {
    return await apiShops.bySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const shop = await fetchShop(slugParts[0] ?? "");

  if (!shop) return { title: "Shop not found | Midora Online" };

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
  const shop = await fetchShop(slugParts[0] ?? "");

  if (!shop) notFound();

  const subPage = slugParts[1];
  const isEditRoute = subPage === "edit";
  const isAnalyticsRoute = subPage === "analytics";
  const skipShopViewPing = isEditRoute || isAnalyticsRoute;
  const quickNav: ShopQuickNavFlags =
    isEditRoute || isAnalyticsRoute
      ? { products: false, about: false, contacts: false, concierge: false }
      : shopQuickNavFlags(shop);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      {!skipShopViewPing ? <ShopPageEffects shopId={shop.id} /> : null}
      <ShopHeader shop={shop} quickNav={quickNav} />
      <main className="flex-1">
        <div className="dm-container pt-3 pb-5 sm:pt-5 sm:pb-8 lg:pt-6 lg:pb-10">
          {children}
        </div>
      </main>
      <ShopFooter shop={shop} />
      <ShopChatWidget shopId={shop.id} shopName={shop.name} />
    </div>
  );
}
