import { Suspense } from "react";
import type { Paginated, Product } from "@/lib/api/products";
import { ApiError } from "@/lib/api/base";
import { merchantApi } from "@/lib/api/server";
import { serverApiFetch } from "@/lib/api/serverFetch";
import MerchantListingsClient from "./MerchantListingsClient";
import MerchantListingsSkeleton from "@/components/skeletons/MerchantListingsSkeleton";
import type { ListingShopSummary } from "./types";

export const dynamic = "force-dynamic";

function sortListings(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const rank = (p: Product) =>
      p.status === "pending_review" ? 0 : p.status === "rejected" ? 1 : 2;
    const rDiff = rank(a) - rank(b);
    if (rDiff !== 0) return rDiff;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

async function listingsViaOwnerRoute(): Promise<Product[] | "missing"> {
  try {
    const first = await serverApiFetch<Paginated<Product>>("/api/v1/products/me?limit=100");
    const items = [...(first.items ?? [])];
    const totalPages = Math.min(first.total_pages ?? 1, 10);
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          serverApiFetch<Paginated<Product>>(
            `/api/v1/products/me?limit=100&page=${i + 2}`,
          ),
        ),
      );
      for (const page of rest) items.push(...(page.items ?? []));
    }
    return sortListings(items);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return "missing";
    return [];
  }
}

export default async function MerchantListingsPage() {
  const shopsRes = await merchantApi.myShops();
  const shops = shopsRes?.items ?? [];

  const direct = await listingsViaOwnerRoute();
  const listings =
    direct === "missing"
      ? sortListings(
          (
            await Promise.all(
              shops.map((s) => merchantApi.shopProducts(s.id, { includeUnpublished: true })),
            )
          ).flat(),
        )
      : direct;

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
