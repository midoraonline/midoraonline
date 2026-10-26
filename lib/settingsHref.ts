import { useSessionStore } from "@/lib/state/session-store";

/** Settings page for the signed-in role, so customers never land on merchant pages and vice versa. */
export function settingsHref(role: string | null | undefined, hash?: string): string {
  const base =
    role === "admin" || role === "staff"
      ? "/admin/settings"
      : role === "merchant"
        ? "/merchant/settings"
        : "/customer/settings";
  return hash ? `${base}#${hash}` : base;
}

export function useSettingsHref(hash?: string): string {
  const role = useSessionStore((s) => s.user?.user_role);
  return settingsHref(role, hash);
}
