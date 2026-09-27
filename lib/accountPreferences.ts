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

export function notificationsFromUser(user: MeResponse | null | undefined): NotificationPreferences {
  const remote = user?.preferences?.notifications;
  if (remote && typeof remote === "object") {
    return { ...DEFAULT_NOTIFICATIONS, ...remote };
  }
  return readLocalNotifications();
}

function preferencesUnavailable(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 405 || err.status === 422 || err.status === 503);
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
    if (me.preferences?.notifications) {
      writeLocalNotifications({ ...DEFAULT_NOTIFICATIONS, ...me.preferences.notifications });
    } else {
      writeLocalNotifications(nextNotes);
    }
    if (isTheme(patch.theme)) {
      try {
        window.localStorage.setItem("midora-theme", patch.theme);
      } catch {
        /* ignore */
      }
    }
    return "remote";
  } catch (err) {
    if (!preferencesUnavailable(err)) throw err;
    writeLocalNotifications(nextNotes);
    if (isTheme(patch.theme)) {
      try {
        window.localStorage.setItem("midora-theme", patch.theme);
      } catch {
        /* ignore */
      }
    }
    return "local";
  }
}
