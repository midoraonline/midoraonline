"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Store } from "lucide-react";
import { useAppSession } from "@/lib/state";

export default function HeroActions() {
  const session = useAppSession();
  const router = useRouter();
  const shopCount = session.ownedShopIds.length;
  const authed = session.isAuthenticated;

  function handleAddItemClick() {
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent("/post-item")}`);
      return;
    }
    router.push("/post-item");
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleAddItemClick}
        aria-label="Add an item to your listings"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-accent/90 active:scale-95"
      >
        <Plus className="size-3.5" strokeWidth={3} aria-hidden />
        Add an Item
      </button>

      {shopCount === 0 ? (
        <Link
          href="/open-shop"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition-all hover:border-border-strong hover:text-foreground active:scale-95"
          title="Analytics, organization, and a shareable storefront"
        >
          <Store className="size-3.5" strokeWidth={2.5} aria-hidden />
          Open a shop
        </Link>
      ) : (
        <Link
          href="/merchant/shops"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition-all hover:border-border-strong hover:text-foreground active:scale-95"
        >
          <Store className="size-3.5" strokeWidth={2.5} aria-hidden />
          Manage shops
        </Link>
      )}
    </div>
  );
}
