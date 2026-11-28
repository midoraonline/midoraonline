"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
import SettingsSwitch from "@/components/settings/SettingsSwitch";
import type { NotificationPreferences } from "@/lib/api/auth";
import { notificationsFromUser, saveAccountPreferences } from "@/lib/accountPreferences";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { useAppSession } from "@/lib/state";
import { platformActionMessage } from "@/lib/platformMessages";

const TYPES: { key: keyof NotificationPreferences; label: string; hint: string; adminOnly?: boolean }[] = [
  { key: "messages", label: "New messages", hint: "When someone sends you a chat message" },
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
    setBusy(true);
    try {
      const where = await saveAccountPreferences({ notifications: patch });
      if (where === "local") toast.message("Saved on this device.");
    } catch (err) {
      setPrefs(notificationsFromUser(session.user));
      toast.error(platformActionMessage(err, "We couldn't save your notification settings. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function setPush(on: boolean) {
    if (on) {
      if (push.support === "unsupported" || push.support === "insecure-context") {
        toast.error("This browser can't show notifications. Try Chrome on your phone or computer.");
        return;
      }
      const ok = await push.enable();
      if (!ok) {
        toast.error(
          push.permission === "denied"
            ? "Notifications are blocked for Midora. Allow them in your browser's site settings, then try again."
            : "Notifications weren't allowed. Tap Allow when your browser asks, then try again.",
        );
        return;
      }
    } else {
      await push.disable();
    }
    await commit({ ...prefs, push: on }, { push: on });
  }

  return (
    <SettingsPanel>
      <SettingsRow title="Channels" description="Turn these off to stop all alerts or emails below.">
        {push.permission === "denied" ? (
          <p className="mb-3 rounded-lg border border-[color:var(--warning)]/30 p-3 text-xs text-[color:var(--warning)]">
            Notifications are blocked for Midora. Allow them in your browser&apos;s site settings, then turn them on here.
          </p>
        ) : null}
        <div className="divide-y divide-border">
          <SettingsSwitch
            label="Browser notifications"
            hint={push.subscribed ? "On for this browser." : "Your browser will ask for permission."}
            checked={prefs.push}
            disabled={busy || push.busy}
            onChange={(on) => void setPush(on)}
          />
          <SettingsSwitch
            label="Email"
            hint="Emails about the things below."
            checked={prefs.email}
            disabled={busy}
            onChange={(on) => void commit({ ...prefs, email: on }, { email: on })}
          />
        </div>
      </SettingsRow>
      <SettingsRow title="What to tell you about" description="Turn off anything you don't need. Changes save right away.">
        <div className="divide-y divide-border">
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
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}
