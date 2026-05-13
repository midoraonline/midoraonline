/** Canonical browser origin for share links and WhatsApp prefills. */
export function publicSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.midoraonline.com"
  );
}
