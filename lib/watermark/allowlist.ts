/**
 * Restrict logo URLs the watermark route may fetch (SSRF mitigation).
 * Expand as you add storage/CDN hosts.
 */
export function isAllowedLogoDownloadUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") {
      return false;
    }
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") {
      return process.env.NODE_ENV !== "production";
    }
    if (h === "utfs.io") return true;
    if (h.endsWith(".ufs.sh")) return true;
    if (h.endsWith(".uploadthing.com") || h.endsWith(".uploadthing.dev")) return true;
    if (h.endsWith(".supabase.co")) return true;
    if (h === "images.unsplash.com") return true;
    return false;
  } catch {
    return false;
  }
}
