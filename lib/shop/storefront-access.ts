import type { AppSession } from "@/lib/state/session-store";

/**
 * Edit / Analytics controls on the public shop UI.
 * The API still enforces authorization; this only gates visibility.
 */
export function canManageShopStorefront(session: AppSession, shopId: string): boolean {
  if (!session.hydrated || !session.isAuthenticated) return false;
  if (session.user?.user_role === "admin") return true;
  return session.ownedShopIds.includes(shopId);
}
