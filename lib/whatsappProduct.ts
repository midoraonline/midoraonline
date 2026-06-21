export function whatsappDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "256" + digits.slice(1);
  } else if (!digits.startsWith("256") && digits.length === 9) {
    digits = "256" + digits;
  }
  return digits;
}

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
