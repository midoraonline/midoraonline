import { useCallback, useSyncExternalStore } from "react";
import { updateProfile } from "@/lib/api/auth";
import { useSessionStore } from "@/lib/state/session-store";

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

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${AREA_COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(AREA_COOKIE.length + 1)) || null : null;
}

function writeCookie(area: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AREA_COOKIE}=${encodeURIComponent(area)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

/** Session choice first, then the signed-in buyer's saved default, then All Uganda. */
export function currentBrowseArea(): string | null {
  return readCookie() ?? useSessionStore.getState().user?.preferences?.default_area ?? null;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBrowseArea() {
  const saved = useSessionStore((s) => s.user?.preferences?.default_area ?? null);
  const signedIn = useSessionStore((s) => s.isAuthenticated);
  const chosen = useSyncExternalStore(subscribe, readCookie, () => null);

  const setArea = useCallback(
    (area: string, remember: boolean) => {
      writeCookie(area);
      listeners.forEach((l) => l());
      if (remember && signedIn) {
        void updateProfile({ preferences: { default_area: area === ALL_UGANDA ? null : area } })
          .then((user) => useSessionStore.getState().setSession({ user }))
          .catch(() => {});
      }
    },
    [signedIn],
  );

  return { area: chosen ?? saved ?? null, saved, setArea, signedIn };
}
