"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { apiAuth } from "@/lib/api";

function CheckEmailInner() {
  const email = useSearchParams().get("email");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  async function resend() {
    setSending(true);
    try {
      const res = await apiAuth.resendVerificationEmail();
      if (res.already_verified) toast.success("Your email is already verified.");
      else toast.success("Verification email sent. Check your inbox and spam folder.");
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

  return (
    <div className="dm-card space-y-5 p-6 text-center sm:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent/10 text-accent">
        <MailCheck className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Check your email to verify</h1>
        <p className="text-sm text-muted">
          We sent a verification link to{" "}
          {email ? <span className="font-medium text-foreground">{email}</span> : "your email address"}. Open it to
          confirm your account.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={resend}
          disabled={sending || cooldown}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : null}
          {cooldown ? "Email sent" : "Resend email"}
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white"
        >
          Continue to Midora
        </Link>
      </div>
      <p className="text-xs text-muted">Can&apos;t find it? Check spam or promotions. The link works once.</p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailInner />
    </Suspense>
  );
}
