"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { ThemedSelect } from "@/components/browse/ThemedSelect";
import { useAppSession } from "@/lib/state";
import {
  ensureShopForListing,
  fetchMyShopSummaries,
  type UserShopSummary,
} from "@/lib/shop/personalShop";

type Phase = "idle" | "provisioning" | "picking";

type ShopOption = {
  value: string;
  label: string;
  logo_url?: string | null;
};

export default function HeroActions() {
  const session = useAppSession();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [shops, setShops] = useState<UserShopSummary[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  const shopCount = session.ownedShopIds.length;
  const hasMultipleShops = shopCount > 1;
  const authed = session.isAuthenticated;

  const loadShops = useCallback(async () => {
    setLoadingShops(true);
    try {
      const list = await fetchMyShopSummaries();
      setShops(list);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn’t load your shops.",
      );
    } finally {
      setLoadingShops(false);
    }
  }, []);

  useEffect(() => {
    if (phase === "picking" && shops.length === 0 && !loadingShops) {
      void loadShops();
    }
  }, [phase, shops.length, loadingShops, loadShops]);

  const shopOptions: ShopOption[] = useMemo(
    () =>
      shops.map((s) => ({
        value: s.id,
        label: s.name,
        logo_url: s.logo_url,
      })),
    [shops],
  );

  const selectedOption =
    shopOptions.find((o) => o.value === selectedShopId) ?? null;

  async function handleAddItemClick() {
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    if (!session.user) return;

    if (hasMultipleShops) {
      router.push("/post-item");
      return;
    }

    if (shopCount === 1) {
      router.push(`/post-item?shop_id=${session.ownedShopIds[0]}`);
      return;
    }

    setPhase("provisioning");
    try {
      const shopId = await ensureShopForListing();
      toast.success("Personal listings ready — add your first item.");
      router.push(`/post-item?shop_id=${shopId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn’t set up your listings.",
      );
    } finally {
      setPhase("idle");
    }
  }

  function confirmPick() {
    if (!selectedShopId) return;
    router.push(`/post-item?shop_id=${selectedShopId}`);
    setPhase("idle");
  }

  function closeAll() {
    setPhase("idle");
    setSelectedShopId(null);
  }

  const createShopHref = shopCount > 0 ? "/merchant/shops" : "/open-shop";
  const createShopLabel = shopCount > 0 ? "Manage Shops" : "Create a Shop";
  const provisioning = phase === "provisioning";

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={createShopHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Store className="size-3.5" strokeWidth={2.5} aria-hidden />
          {createShopLabel}
        </Link>

        <button
          type="button"
          onClick={() => void handleAddItemClick()}
          disabled={provisioning}
          aria-label="Add an item to your listings"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/15 active:scale-95 disabled:cursor-progress disabled:opacity-70"
        >
          {provisioning ? (
            <span
              className="size-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
              aria-hidden
            />
          ) : (
            <Plus className="size-3.5" strokeWidth={3} aria-hidden />
          )}
          {provisioning ? "Preparing…" : "Add an Item"}
        </button>
      </div>

      {phase === "picking" ? (
        <FormModal
          title="Post to which shop?"
          onClose={closeAll}
          maxWidthClass="sm:max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAll}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPick}
                disabled={!selectedShopId || loadingShops}
                className="dm-btn dm-btn-primary dm-btn-sm"
              >
                Continue
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Choose the shop this item belongs to. You can change this later
              per listing.
            </p>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Destination shop
              </span>
              <ThemedSelect<ShopOption>
                instanceId="hero-shop-picker"
                aria-label="Choose a shop"
                size="md"
                isSearchable
                minControlWidth="w-full"
                placeholder={
                  loadingShops ? "Loading your shops…" : "Select a shop"
                }
                isLoading={loadingShops}
                value={selectedOption}
                options={shopOptions}
                onChange={(opt) => setSelectedShopId(opt?.value ?? null)}
                noOptionsMessage={() =>
                  loadingShops ? "Loading…" : "No shops found"
                }
              />
            </label>

            <div className="rounded-lg border border-border bg-surface-subtle/60 p-3 text-xs text-muted">
              <p className="font-medium text-foreground">
                Don’t have the right shop?
              </p>
              <p className="mt-0.5">
                <Link
                  href="/open-shop"
                  onClick={closeAll}
                  className="font-semibold text-accent hover:underline"
                >
                  Create a new shop
                </Link>{" "}
                or continue posting to your existing one.
              </p>
            </div>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
