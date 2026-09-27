import { apiAuth } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import type {
  MeResponse,
  NotificationPreferences,
  ThemePreference,
  UpdateProfileRequest,
} from "@/lib/api/auth";
import { useSessionStore } from "@/lib/state/session-store";

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  push: true,
  email: true,
  messages: true,
  listing_approved: true,
  listing_rejected: true,
  reviews: true,
  reports: true,
};

const LOCAL_KEY = "midora-notification-prefs";
/** "1" after a preferences write sticks; "0" when the API has no preferences yet. */
const REMOTE_KEY = "midora-preferences-remote";

function isTheme(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readLocalNotifications(): NotificationPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_NOTIFICATIONS };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATIONS };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATIONS, ...parsed };
  } catch {
    return { ...DEFAULT_NOTIFICATIONS };
  }
}

export function writeLocalNotifications(prefs: NotificationPreferences) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function remotePreferencesBlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMOTE_KEY) === "0";
  } catch {
    return false;
  }
}

function markRemotePreferences(available: boolean) {
  try {
    window.localStorage.setItem(REMOTE_KEY, available ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function notificationsFromUser(user: MeResponse | null | undefined): NotificationPreferences {
  if (remotePreferencesBlocked()) return readLocalNotifications();
  const remote = user?.preferences?.notifications;
  if (remote && typeof remote === "object") {
    return { ...DEFAULT_NOTIFICATIONS, ...remote };
  }
  return readLocalNotifications();
}

/** Column for bio or preferences is missing until migration 049. */
export function migrationRequired(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503 && (err.code === "migration_required" || !err.code);
}

/** 503 migration_required, or an API that does not accept preferences yet. */
export function preferencesUnavailable(err: unknown): boolean {
  if (migrationRequired(err)) return true;
  return err instanceof ApiError && (err.status === 404 || err.status === 405 || err.status === 422);
}

/** PATCH /auth/me preferences. Keeps a local copy when the API has no preferences yet. */
export async function saveAccountPreferences(
  patch: NonNullable<UpdateProfileRequest["preferences"]>,
): Promise<"remote" | "local"> {
  const current = notificationsFromUser(useSessionStore.getState().user);
  const nextNotes: NotificationPreferences = {
    ...current,
    ...(patch.notifications ?? {}),
  };
  try {
    const me = await apiAuth.updateProfile({ preferences: patch });
    useSessionStore.getState().setSession({ user: me });
    if (!me.preferences) {
      writeLocalNotifications(nextNotes);
      rememberTheme(patch.theme);
      markRemotePreferences(false);
      return "local";
    }
    markRemotePreferences(true);
    writeLocalNotifications({ ...DEFAULT_NOTIFICATIONS, ...me.preferences.notifications });
    rememberTheme(patch.theme ?? me.preferences.theme);
    return "remote";
  } catch (err) {
    if (!preferencesUnavailable(err)) throw err;
    markRemotePreferences(false);
    writeLocalNotifications(nextNotes);
    rememberTheme(patch.theme);
    return "local";
  }
}

function rememberTheme(theme: ThemePreference | undefined) {
  if (!isTheme(theme)) return;
  try {
    window.localStorage.setItem("midora-theme", theme);
  } catch {
    /* ignore */
  }
}
