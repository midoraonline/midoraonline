"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Store, Loader2, ArrowLeft } from "lucide-react";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { useAppSession } from "@/lib/state";
import { fetchMyShopSummaries, type UserShopSummary } from "@/lib/shop/personalShop";
import type { ItemType } from "@/lib/api/products";

function NewListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useAppSession();

  const paramShopId = searchParams.get("shop_id") || searchParams.get("shopId");
  const paramItemType = (searchParams.get("item_type") || searchParams.get("itemType") || "product") as ItemType;

  const [shops, setShops] = useState<UserShopSummary[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(paramShopId);

  useEffect(() => {
    let active = true;
    fetchMyShopSummaries()
      .then((list) => {
        if (!active) return;
        setShops(list);
        if (!paramShopId && list.length === 1) {
          setSelectedShopId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingShops(false);
      });

    return () => {
      active = false;
    };
  }, [paramShopId]);

  if (!session.hydrated || loadingShops) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-20 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading your shop details…</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Store className="size-7" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Open a shop first</h1>
        <p className="text-xs text-muted leading-relaxed">
          Listings on Midora belong to a shop storefront. Create your free shop first to start posting products.
        </p>
        <div className="pt-2">
          <Link href="/open-shop" className="dm-btn dm-btn-primary dm-btn-md">
            Create a shop
          </Link>
        </div>
      </div>
    );
  }

  // If user has multiple shops and hasn't picked one yet:
  if (!selectedShopId && shops.length > 1) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-12 px-4">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Choose a shop for your listing
          </h1>
          <p className="text-xs text-muted">
            Select which shop storefront this item should be listed under.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {shops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedShopId(s.id)}
              className="dm-card flex items-center gap-3.5 p-4 text-left hover:border-accent/40 transition-all hover:shadow-sm"
            >
              {s.logo_url ? (
                <Image
                  src={s.logo_url}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-sm shrink-0">
                  {s.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted truncate">Shop Storefront</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/merchant/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Cancel and return
          </Link>
        </div>
      </div>
    );
  }

  const activeShopId = selectedShopId || shops[0]?.id;

  return (
    <ProductFormPage
      mode="add"
      shopId={activeShopId}
      itemType={paramItemType}
      backUrl="/merchant/listings"
    />
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-20 text-muted">
          <Loader2 className="size-6 animate-spin text-accent" />
          <p className="text-sm font-medium">Loading page…</p>
        </div>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}
