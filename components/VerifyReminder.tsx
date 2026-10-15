"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { apiAuth, apiShops } from "@/lib/api";
import { useAppSession } from "@/lib/state";

type Step = { key: string; label: string; done: boolean; href?: string };

/**
 * In-platform verification reminder, tailored by role:
 * - customer: verify email
 * - merchant: verify email, phone, then business identity
 * - admin/staff: nothing
 */
export default function VerifyReminder() {
  const session = useAppSession();
  const user = session.user;
  const role = user?.user_role ?? "customer";
  const isMerchant = role === "merchant";
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const { data: shops } = useSWR(
    session.isAuthenticated && isMerchant ? "verify-reminder:my-shops" : null,
    () => apiShops.myShops().then((r) => r.items),
  );

  if (!session.isAuthenticated || !user || dismissed) return null;
  if (role === "admin" || role === "staff") return null;

  const settingsHref = isMerchant ? "/merchant/settings" : "/customer/settings";

  async function resend() {
    if (sending || cooldown) return;
    setSending(true);
    try {
      const res = await apiAuth.resendVerificationEmail();
      toast.success(
        res.already_verified ? "Your email is already verified." : "Verification email sent. Check your inbox and spam folder.",
      );
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 60_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /429|too many/i.test(msg)
          ? "Please wait a minute before requesting another email."
          : "We couldn't send the email right now. Try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  }

  const steps: Step[] = [{ key: "email", label: "Verify your email", done: !!user.email_verified }];
  if (isMerchant) {
    steps.push({ key: "phone", label: "Verify your phone", done: !!user.phone_verified, href: settingsHref });
    const firstShop = shops?.[0];
    const identityDone = !!shops?.some((s) => s.trust_badges?.includes("identity_verified"));
    steps.push({
      key: "identity",
      label: "Verify your identity",
      done: identityDone,
      href: firstShop ? `/merchant/shops/${firstShop.id}/verification` : "/merchant/shops",
    });
  }
  const pending = steps.filter((s) => !s.done);
  if (pending.length === 0) return null;
  // Merchant identity status loads async; don't flash a reminder that only lists identity.
  if (isMerchant && shops === undefined && pending.every((s) => s.key === "identity")) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <ShieldCheck className="hidden size-5 shrink-0 text-accent sm:block" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          {isMerchant ? "Finish verifying to build buyer trust" : "Verify your email to secure your account"}
        </p>
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {pending.map((s) =>
            s.key === "email" ? (
              <li key={s.key} className="flex items-center gap-2">
                <span className="text-muted">Check your inbox for the link.</span>
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={sending || cooldown}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
                  {cooldown ? "Sent" : "Resend"}
                </button>
              </li>
            ) : (
              <li key={s.key}>
                <Link href={s.href ?? settingsHref} className="font-medium text-accent underline-offset-2 hover:underline">
                  {s.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="self-end rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground sm:self-center"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
