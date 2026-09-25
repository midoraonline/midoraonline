import { apiAuth, apiShops } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { realShops } from "@/lib/shop/realShops";
import { useSessionStore } from "@/lib/state/session-store";

/** Re-read /auth/me after a publish that may have promoted the user to merchant. */
export async function rehydrateSession(): Promise<void> {
  const user = await apiAuth.me();
  let ownedShopIds: string[] = [];
  try {
    const mine = await apiShops.myShops();
    ownedShopIds = realShops(mine.items ?? []).map((shop) => shop.id);
  } catch {
    /* listings can exist before a real shop */
  }
  useSessionStore.getState().setSession({
    hydrated: true,
    isAuthenticated: true,
    user,
    ownedShopIds,
    profileError: null,
  });
  notifyAuthChanged();
}
