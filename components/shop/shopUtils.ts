import type { Shop } from "@/lib/api/shops";

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
