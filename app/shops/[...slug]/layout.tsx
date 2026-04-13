import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFooter from "@/components/shop/ShopFooter";
import ShopChatWidget from "@/components/shopChatWidget";
import { locationDisplay } from "@/components/shop/shopUtils";

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
  const shop = await fetchShop(Array.isArray(slug) ? slug[0] : slug);

  if (!shop) return { title: "Shop not found | Midora Online" };

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
  const shop = await fetchShop(Array.isArray(slug) ? slug[0] : slug);

  if (!shop) notFound();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <ShopHeader shop={shop} />
      <main className="flex-1">
        <div className="dm-container py-6 sm:py-10 lg:py-12">{children}</div>
      </main>
      <ShopFooter shop={shop} />
      <ShopChatWidget shopId={shop.id} shopName={shop.name} />
    </div>
  );
}
