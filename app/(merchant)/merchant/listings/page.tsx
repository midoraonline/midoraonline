import { Suspense } from "react";
import type { Product } from "@/lib/api/products";
import { merchantApi } from "@/lib/api/server";
import MerchantListingsClient from "./MerchantListingsClient";
import MerchantListingsSkeleton from "@/components/skeletons/MerchantListingsSkeleton";
import type { ListingShopSummary } from "./types";

export const dynamic = "force-dynamic";

export default async function MerchantListingsPage() {
  const shopsRes = await merchantApi.myShops();
  const shops = shopsRes?.items ?? [];

  // Aggregate every listing across every shop the merchant owns. For the
  // typical Midora merchant (1–3 shops) this is cheap and gives us a single
  // unified queue view (Reviewing / Live / Not approved / Draft).
  const perShop = await Promise.all(
    shops.map((s) => merchantApi.shopProducts(s.id, { includeUnpublished: true })),
  );

  const listings = (perShop.flat() as Product[]).sort((a, b) => {
    // Reviewing first, then rejected (needs merchant action), then everything else.
    // Within each bucket newest first.
    const rank = (p: Product) =>
      p.status === "pending_review" ? 0 : p.status === "rejected" ? 1 : 2;
    const rDiff = rank(a) - rank(b);
    if (rDiff !== 0) return rDiff;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });

  const shopSummaries: ListingShopSummary[] = shops.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug ?? null,
    logo_url: s.logo_url ?? null,
  }));

  return (
    <Suspense fallback={<MerchantListingsSkeleton />}>
      <MerchantListingsClient
        initialListings={listings}
        shops={shopSummaries}
      />
    </Suspense>
  );
}
