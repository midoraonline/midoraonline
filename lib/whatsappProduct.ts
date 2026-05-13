/** WhatsApp deep links for Midora listings (chat completes in WhatsApp, not in-app). */

export function whatsappDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Opens WhatsApp with the standard buyer intent message.
 * Optional `itemUrl` lets sellers see exactly which listing was tapped.
 */
export function productInquiryWhatsAppUrl(
  phoneRaw: string,
  opts?: { itemTitle?: string; itemUrl?: string },
): string | null {
  const digits = whatsappDigits(phoneRaw);
  if (!digits) return null;

  let msg = "Hi, I saw your item on Midora — is it still available?";
  if (opts?.itemTitle?.trim()) {
    msg += `\n\n(RE: ${opts.itemTitle.trim()})`;
  }
  if (opts?.itemUrl?.trim()) {
    msg += `\n${opts.itemUrl.trim()}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

/** Prefilled message when a buyer opens WhatsApp from a shop storefront. */
export function shopInquiryWhatsAppUrl(
  phoneRaw: string,
  opts?: { shopName?: string; shopUrl?: string },
): string | null {
  const digits = whatsappDigits(phoneRaw);
  if (!digits) return null;

  let msg = "Hi, I found your shop on Midora and wanted to get in touch.";
  if (opts?.shopName?.trim()) {
    msg += `\n\n(Shop: ${opts.shopName.trim()})`;
  }
  if (opts?.shopUrl?.trim()) {
    msg += `\n${opts.shopUrl.trim()}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
