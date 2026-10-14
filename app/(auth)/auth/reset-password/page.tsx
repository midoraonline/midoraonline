"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { apiAuth } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";

const MIN_LEN = 8;

function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/reset_expired|expired/i.test(raw)) return "This reset link has expired. Request a new one below.";
  if (/reset_used|already been used/i.test(raw)) return "This reset link was already used. Request a new one below.";
  if (/reset_invalid|invalid/i.test(raw)) return "This reset link is not valid. Request a new one below.";
  if (/429|too many/i.test(raw)) return "Too many attempts. Please wait a minute and try again.";
  return "Something went wrong. Please try again.";
}

function RequestForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiAuth.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-accent" />
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a
          link to reset your password. It expires in 60 minutes.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Forgot your password?</h1>
        <p className="text-sm text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium text-foreground/80">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-foreground outline-none focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/10"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Send reset link
      </button>
    </form>
  );
}

function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LEN) return setError(`Use at least ${MIN_LEN} characters.`);
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    setError(null);
    try {
      await apiAuth.resetPassword(token, password);
      toast.success("Password updated. Sign in with your new password.");
      router.replace("/login");
    } catch (err) {
      setError(errorMessage(err));
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (failed) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <RequestForm />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
        <p className="text-sm text-muted">You&apos;ll be signed out on other devices.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground/80">
          New password
        </label>
        <PasswordInput
          id="new-password"
          required
          minLength={MIN_LEN}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground/80">
          Confirm password
        </label>
        <PasswordInput
          id="confirm-password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Update password
      </button>
    </form>
  );
}

function ResetPasswordInner() {
  const token = useSearchParams().get("token");
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {token ? <NewPasswordForm token={token} /> : <RequestForm />}
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
