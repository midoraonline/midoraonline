import { apiShops } from "@/lib/api";
import type { MeResponse } from "@/lib/api/auth";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useSessionStore } from "@/lib/state/session-store";

// Personal-listing shop spec derived from a user's profile. Falls back
// gracefully when full_name / email are missing so slugs stay unique.
export function derivePersonalShopSpec(user: MeResponse): {
  name: string;
  displayFirstName: string;
  slug: string;
} {
  const raw =
    user.full_name?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    `Seller-${user.id.slice(0, 6)}`;
  const firstToken = raw.split(/\s+/)[0] || raw;
  const cleaned = firstToken.replace(/[^\p{L}\p{N}]+/gu, "");
  const displayFirstName =
    cleaned ||
    `Seller-${user.id.replace(/-/g, "").slice(0, 6)}`;
  const idSuffix = user.id.replace(/-/g, "").slice(0, 6).toLowerCase();
  const slugBase = displayFirstName.toLowerCase();
  return {
    displayFirstName,
    name: `${displayFirstName}'s Listings`,
    slug: `${slugBase}-listings-${idSuffix}`,
  };
}

/**
 * Idempotently ensure the current user has at least one shop to attach a
 * listing to. If none exist, auto-provision a lightweight personal shop
 * and update the session. Returns the shopId to post the listing to.
 */
export async function ensureShopForListing(): Promise<string> {
  const state = useSessionStore.getState();
  if (state.ownedShopIds.length > 0) {
    return state.ownedShopIds[0];
  }
  if (!state.user) {
    throw new Error("Please sign in to add an item.");
  }
  const spec = derivePersonalShopSpec(state.user);
  const created = await apiShops.createShop({
    name: spec.name,
    slug: spec.slug,
    shop_type: "product",
    description: "Personal listings",
  });
  useSessionStore.setState({
    ownedShopIds: [...useSessionStore.getState().ownedShopIds, created.id],
  });
  // Refreshes /me + shops so the navbar / role updates.
  notifyAuthChanged();
  return created.id;
}

export type UserShopSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
};

export async function fetchMyShopSummaries(): Promise<UserShopSummary[]> {
  const res = await apiShops.myShops();
  return res.items.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    logo_url: s.logo_url ?? null,
  }));
}
