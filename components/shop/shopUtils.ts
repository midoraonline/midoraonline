import type { Contact, Shop } from "@/lib/api/shops";

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

export function platformLabel(platform?: string | null): string {
  if (!platform) return "Link";
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}
