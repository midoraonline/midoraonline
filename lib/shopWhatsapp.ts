import * as apiShops from "@/lib/api/shops";

/** Ask the API whether a new shop's number is on WhatsApp. Never blocks or surfaces errors. */
export function checkShopWhatsAppQuietly(shopId: string, hasNumber: boolean): void {
  if (!hasNumber) return;
  void apiShops.checkShopWhatsApp(shopId).catch(() => {
    /* the owner sees the status (and the OTP fallback) in shop settings */
  });
}
