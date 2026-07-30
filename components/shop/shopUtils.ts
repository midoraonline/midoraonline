import type { Contact, Shop, ShopLocation } from "@/lib/api/shops";
import type { LatLng } from "@/lib/geo/types";

export function filterDuplicateContacts(shop: Shop): Contact[] {
  const emailNorm = shop.shop_email?.trim().toLowerCase() ?? "";
  const waNorm = shop.whatsapp_number?.replace(/\D/g, "") ?? "";
  return (
    shop.contacts?.filter((c) => {
      const v = c.value.trim();
      if (emailNorm && v.toLowerCase() === emailNorm) return false;
      if (waNorm && v.replace(/\D/g, "") === waNorm) return false;
      return true;
    }) ?? []
  );
}

export type ShopQuickNavFlags = {
  products: boolean;
  about: boolean;
  contacts: boolean;
  concierge: boolean;
};

export function shopQuickNavFlags(shop: Shop): ShopQuickNavFlags {
  const desc = (shop.description ?? "").trim();
  const about = (shop.about ?? "").trim();
  return {
    products: true,
    about: Boolean(about && about !== desc),
    contacts: filterDuplicateContacts(shop).length > 0,
    concierge: true,
  };
}

export function locationDisplay(loc: Shop["location"]): string {
  if (typeof loc === "string") return loc;
  if (loc && typeof loc === "object" && "display" in loc)
    return String((loc as { display?: string }).display ?? "Online");
  return "Online";
}

/** Read stored WGS84 coords from a shop location JSON (if present). */
export function locationCoords(loc: Shop["location"]): LatLng | null {
  if (!loc || typeof loc !== "object") return null;
  const lat = Number((loc as ShopLocation).lat);
  const lng = Number((loc as ShopLocation).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Build the location payload merchants persist.
 * Prefer Nominatim-resolved coords when the user picked a suggestion.
 */
export function buildShopLocationPayload(
  display: string,
  coords?: LatLng | null,
): ShopLocation | null {
  const trimmed = display.trim();
  if (!trimmed || trimmed === "Online Shop") return null;
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return { display: trimmed, lat: coords.lat, lng: coords.lng };
  }
  return { display: trimmed };
}

export function platformLabel(platform?: string | null): string {
  if (!platform) return "Link";
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}
