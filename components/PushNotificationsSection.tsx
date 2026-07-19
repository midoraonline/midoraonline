"use client";

import { toast } from "sonner";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/push";

/**
 * Push-notification opt-in shown on account settings pages. Renders even
 * when the browser doesn't support push, so users have consistent guidance.
 */
export default function PushNotificationsSection() {
  const { support, permission, subscribed, busy, enable, disable } = usePushNotifications();

  const handleTest = async () => {
    try {
      const res = await sendTestPush();
      toast.success(
        res.delivered
          ? `Sent a test push to ${res.delivered} device${res.delivered === 1 ? "" : "s"}.`
          : "No devices are subscribed yet.",
      );
    } catch {
      toast.error("Couldn't send a test push. Try again.");
    }
  };

  return (
    <section className="dm-card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <MaterialSymbol name="notifications_active" className="!text-lg" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Browser notifications</h2>
          <p className="text-xs text-muted">
            Get pinged when you receive a new message, even if this tab is
            in the background.
          </p>
        </div>
      </div>

      {support === "unsupported" ? (
        <p className="rounded-xl bg-foreground/[0.04] p-3 text-xs text-muted">
          Your browser doesn&apos;t support push notifications. Try the latest
          Chrome, Edge, Firefox, or Safari.
        </p>
      ) : support === "insecure-context" ? (
        <p className="rounded-xl bg-foreground/[0.04] p-3 text-xs text-muted">
          Push notifications require a secure (HTTPS) connection.
        </p>
      ) : permission === "denied" ? (
        <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700">
          Notifications are blocked for this site. Enable them from your
          browser&apos;s site settings, then reload this page.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {subscribed ? "Notifications are on" : "Notifications are off"}
            </p>
            <p className="text-xs text-muted">
              {subscribed
                ? "You'll receive push notifications for new chat messages."
                : "Turn on to receive push notifications on this device."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {subscribed ? (
              <>
                <button
                  type="button"
                  onClick={handleTest}
                  className="dm-focus rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-foreground/[0.04]"
                >
                  Send test
                </button>
                <button
                  type="button"
                  onClick={() => void disable()}
                  disabled={busy}
                  className="dm-focus rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
                >
                  {busy ? "Turning off…" : "Turn off"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void enable()}
                disabled={busy}
                className="dm-focus rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Enabling…" : "Enable notifications"}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
