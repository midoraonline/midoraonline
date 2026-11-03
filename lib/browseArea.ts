export const AREA_COOKIE = "midora_area";
export const ALL_UGANDA = "all";

export const BROWSE_AREAS = [
  { value: "kampala", label: "Kampala" },
  { value: "wakiso", label: "Wakiso" },
  { value: "mukono", label: "Mukono" },
  { value: "entebbe", label: "Entebbe" },
] as const;

export function areaLabel(area: string | null | undefined): string {
  if (!area || area === ALL_UGANDA) return "All Uganda";
  return BROWSE_AREAS.find((a) => a.value === area)?.label ?? area;
}

export function readAreaCookie(): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${AREA_COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(AREA_COOKIE.length + 1)) || null : null;
}

const listeners = new Set<() => void>();

export function subscribeArea(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeAreaCookie(area: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AREA_COOKIE}=${encodeURIComponent(area)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
  listeners.forEach((l) => l());
}

/** The browser's chosen area; without one the API falls back to the signed-in buyer's saved default. */
export function currentBrowseArea(): string | null {
  return readAreaCookie();
}
