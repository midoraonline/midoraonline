"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Store } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { useAppSession } from "@/lib/state";
import { fetchMyShopSummaries, type UserShopSummary } from "@/lib/shop/personalShop";
import type { ItemType } from "@/lib/api/products";

function NewListingContent() {
  const searchParams = useSearchParams();
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
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading your shop details…</p>
      </div>
    );
  }

  // No shop yet — nudge to open one first.
  if (shops.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-20 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/10 text-accent">
          <Store className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-bold text-foreground">Open a shop first</h1>
          <p className="text-sm text-muted leading-relaxed">
            Listings belong to a shop storefront. Create your free shop, then come back to post.
          </p>
        </div>
        <Link href="/open-shop" className="dm-btn dm-btn-primary">
          Create a shop
        </Link>
      </div>
    );
  }

  // Multiple shops — let the merchant pick one.
  if (!selectedShopId && shops.length > 1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:py-14">
        <div className="space-y-1.5 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Which shop is this for?
          </h1>
          <p className="text-sm text-muted">
            Pick the storefront that owns this listing. You can move it later.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {shops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedShopId(s.id)}
              className="dm-card dm-focus flex items-center gap-3.5 p-4 text-left transition-all hover:border-accent/40 hover:shadow-md"
            >
              {s.logo_url ? (
                <Image
                  src={s.logo_url}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {s.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{s.name}</p>
                <p className="truncate text-xs text-muted">Shop storefront</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/merchant/listings"
            className="dm-focus inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground"
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
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <ProductFormPage
        mode="add"
        shopId={activeShopId}
        itemType={paramItemType}
        backUrl="/merchant/listings"
      />
    </div>
  );
}

export default function PostItemPage() {
  return (
    <StandaloneShell eyebrow="Post an item" closeHref="/merchant/listings">
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 className="size-6 animate-spin text-accent" />
            <p className="text-sm font-medium">Loading page…</p>
          </div>
        }
      >
        <NewListingContent />
      </Suspense>
    </StandaloneShell>
  );
}
