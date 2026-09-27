"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import type { NotificationPreferences } from "@/lib/api/auth";
import {
  notificationsFromUser,
  saveAccountPreferences,
  writeLocalNotifications,
} from "@/lib/accountPreferences";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { useAppSession } from "@/lib/state";

const TYPES: { key: keyof NotificationPreferences; label: string; hint: string; adminOnly?: boolean }[] = [
  { key: "messages", label: "New messages", hint: "Chat messages" },
  { key: "listing_approved", label: "Listing approved", hint: "When a listing goes live" },
  { key: "listing_rejected", label: "Listing rejected", hint: "When a listing needs changes" },
  { key: "reviews", label: "Reviews", hint: "New reviews on your listings" },
  { key: "reports", label: "Reports", hint: "New reports for admins", adminOnly: true },
];

export default function NotificationSettings() {
  const session = useAppSession();
  const push = usePushNotifications();
  const isAdmin = session.user?.user_role === "admin";
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => notificationsFromUser(session.user));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) setPrefs(notificationsFromUser(session.user));
  }, [session.user, busy]);

  async function commit(next: NotificationPreferences, patch: Partial<NotificationPreferences>) {
    setPrefs(next);
    writeLocalNotifications(next);
    setBusy(true);
    try {
      const where = await saveAccountPreferences({ notifications: patch });
      if (where === "local") toast.message("Saved on this device.");
    } catch (err) {
      setPrefs(notificationsFromUser(session.user));
      toast.error(err instanceof Error ? err.message : "Could not save notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function setPush(on: boolean) {
    if (on) {
      if (push.support === "unsupported" || push.support === "insecure-context") {
        toast.error("This browser cannot receive push notifications.");
        return;
      }
      const ok = await push.enable();
      if (!ok) {
        toast.error(
          push.permission === "denied"
            ? "Notifications are blocked in the browser. Allow them in site settings, then try again."
            : "Push permission was not granted.",
        );
        return;
      }
    } else {
      await push.disable();
    }
    await commit({ ...prefs, push: on }, { push: on });
  }

  return (
    <section className="dm-card space-y-1 p-4 sm:p-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <p className="mt-0.5 text-xs text-muted">Push and email are the master switches.</p>
      </div>
      {push.permission === "denied" ? (
        <p className="mb-3 rounded-xl bg-[color:var(--warning)]/10 p-3 text-xs text-[color:var(--warning)]">
          Push is blocked for this site. Allow notifications in the browser, then turn it on here.
        </p>
      ) : null}
      <SettingsSwitch
        label="Push"
        hint={push.subscribed ? "This browser can receive push." : "Asks the browser for permission."}
        checked={prefs.push}
        disabled={busy || push.busy}
        onChange={(on) => void setPush(on)}
      />
      <SettingsSwitch
        label="Email"
        hint="Account emails for the types below."
        checked={prefs.email}
        disabled={busy}
        onChange={(on) => void commit({ ...prefs, email: on }, { email: on })}
      />
      <div className="my-2 border-t border-border" />
      {TYPES.filter((item) => !item.adminOnly || isAdmin).map((item) => (
        <SettingsSwitch
          key={item.key}
          label={item.label}
          hint={item.hint}
          checked={prefs[item.key]}
          disabled={busy}
          onChange={(on) => void commit({ ...prefs, [item.key]: on }, { [item.key]: on })}
        />
      ))}
    </section>
  );
}
