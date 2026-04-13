"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiAuth } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "merchant">("merchant");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedOAuthRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError("Google sign-up was cancelled or failed. Please try again.");
      return;
    }
    if (!code || !state) {
      return;
    }
    const oauthKey = `${code}:${state}`;
    if (processedOAuthRef.current === oauthKey) {
      return;
    }
    processedOAuthRef.current = oauthKey;

    let cancelled = false;
    (async () => {
      setGoogleLoading(true);
      setError(null);
      try {
        const tokens = await apiAuth.exchangeGoogleCode({ code, state });
        if (cancelled) return;
        if (tokens.access_token) {
          window.localStorage.setItem("midora_access_token", tokens.access_token);
        }
        if (tokens.refresh_token) {
          window.localStorage.setItem("midora_refresh_token", tokens.refresh_token);
        }
        window.dispatchEvent(new Event("midora-auth-changed"));
        router.replace("/");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete Google sign-up. Please try again."
        );
      } finally {
        if (!cancelled) {
          setGoogleLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await apiAuth.register({
        email,
        password,
        full_name: fullName,
        user_role: role,
      });
      if (tokens.access_token) {
        window.localStorage.setItem("midora_access_token", tokens.access_token);
      }
      if (tokens.refresh_token) {
        window.localStorage.setItem("midora_refresh_token", tokens.refresh_token);
      }
      window.dispatchEvent(new Event("midora-auth-changed"));
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { url } = await apiAuth.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start Google sign-up. Please try again."
      );
      setGoogleLoading(false);
    }
  }

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Create your Midora Online account</h1>
      <p className="mt-2 text-sm text-muted">
        Start your 60-second shop setup journey. We&apos;ll email you a link to verify
        your address.
      </p>

      <button
        type="button"
        disabled={googleLoading || loading}
        onClick={handleGoogleSignUp}
        className="mt-6 w-full dm-pill dm-focus border border-border bg-surface hover:bg-surface/80 transition-colors justify-center h-11 gap-2"
      >
        <img src="/icons/google.svg" alt="" className="h-5 w-5" />
        {googleLoading ? "Connecting to Google…" : "Continue with Google"}
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/90">Full name</label>
          <input
            type="text"
            required
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/90">Email</label>
          <input
            type="email"
            required
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/90">Password</label>
          <input
            type="password"
            required
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/90">I&apos;m signing up as</label>
          <select
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
            value={role}
            onChange={(e) => setRole(e.target.value as "customer" | "merchant")}
          >
            <option value="merchant">Merchant</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity justify-center h-11"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-xs text-muted">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-foreground/80 hover:text-foreground">
          Sign in
        </a>
      </p>
    </div>
  );
}

