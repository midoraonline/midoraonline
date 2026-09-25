"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { useAppSession } from "@/lib/state";
import {
  fetchMyShopSummaries,
  type UserShopSummary,
} from "@/lib/shop/personalShop";
import type { ItemType } from "@/lib/api/products";

function ShopPicker({
  shops,
  onSelect,
}: {
  shops: UserShopSummary[];
  onSelect: (shopId: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:py-14">
      <div className="space-y-1.5 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Which shop is this for?
        </h1>
        <p className="text-sm text-muted">
          You have more than one shop. Pick the storefront that owns this listing.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shops.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
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

function NewListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useAppSession();

  const paramShopId = searchParams.get("shop_id") || searchParams.get("shopId");
  const paramItemType = (searchParams.get("item_type") || searchParams.get("itemType") || "product") as ItemType;

  const [shops, setShops] = useState<UserShopSummary[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(paramShopId);
  const [formMounted, setFormMounted] = useState(Boolean(paramShopId));
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!session.hydrated || session.isAuthenticated) return;
    router.replace(`/login?next=${encodeURIComponent("/post-item")}`);
  }, [session.hydrated, session.isAuthenticated, router]);

  useEffect(() => {
    let active = true;
    fetchMyShopSummaries()
      .then((list) => {
        if (!active) return;
        setShops(list);
        if (paramShopId) {
          setSelectedShopId(paramShopId);
          setFormMounted(true);
          return;
        }
        // One real shop is attached by POST /api/v1/products. Several need a pick.
        if (list.length > 1) setPickerOpen(true);
        else setFormMounted(true);
      })
      .catch(() => {
        if (active) setFormMounted(true);
      })
      .finally(() => {
        if (active) setLoadingShops(false);
      });
    return () => {
      active = false;
    };
  }, [paramShopId]);

  async function openPicker() {
    if (shops.length === 0) {
      try {
        const list = await fetchMyShopSummaries();
        setShops(list);
      } catch {
        /* picker still opens with whatever we have */
      }
    }
    setPickerOpen(true);
    setFormMounted(true);
  }

  function chooseShop(shopId: string) {
    setSelectedShopId(shopId);
    setPickerOpen(false);
    setFormMounted(true);
  }

  if (!session.hydrated || !session.isAuthenticated || loadingShops) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading page…</p>
      </div>
    );
  }

  const showPicker = pickerOpen || (!formMounted && shops.length > 1);

  return (
    <>
      {formMounted ? (
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <ProductFormPage
            mode="add"
            shopId={selectedShopId ?? undefined}
            itemType={paramItemType}
            backUrl="/merchant/listings"
            hasBottomNav={false}
            onShopRequired={() => void openPicker()}
          />
        </div>
      ) : null}
      {showPicker ? (
        <div className={formMounted ? "fixed inset-0 z-50 overflow-y-auto bg-background" : undefined}>
          <ShopPicker shops={shops} onSelect={chooseShop} />
        </div>
      ) : null}
    </>
  );
}

export default function PostItemPage() {
  return (
    <StandaloneShell eyebrow="Post an item" closeHref="/">
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
