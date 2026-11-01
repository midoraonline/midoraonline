/** A personal seller profile is not a public storefront. */
export function isPersonalShop(shop: { is_personal?: boolean | null }): boolean {
  return shop.is_personal === true;
}

export function realShops<T extends { is_personal?: boolean | null }>(shops: T[]): T[] {
  return shops.filter((shop) => !isPersonalShop(shop));
}

/** Shown wherever a listing belongs to a seller without a business. */
export const PERSONAL_SELLER_LABEL = "Personal seller";
