"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedOAuthRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError("Google sign-in was cancelled or failed. Please try again.");
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
            : "Unable to complete Google sign-in. Please try again."
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
      const tokens = await apiAuth.login({ email, password });
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
          : "Unable to sign in. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { url } = await apiAuth.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start Google sign-in. Please try again."
      );
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-pretty text-xl font-semibold tracking-tight sm:text-2xl">
          Sign in to Midora Online
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Access your shops, products, and subscriptions.
        </p>
      </header>

      <div className="space-y-4">
        <button
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogleSignIn}
          className="dm-pill flex min-h-12 w-full items-center justify-center gap-2 border border-border bg-transparent text-sm font-medium transition-colors hover:bg-primary/[0.03] active:bg-primary/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/25 disabled:opacity-60"
        >
          <img src="/icons/google.svg" alt="" className="h-5 w-5 shrink-0" />
          {googleLoading ? "Connecting to Google…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="h-px min-w-0 flex-1 bg-border" />
          <span className="shrink-0">or</span>
          <div className="h-px min-w-0 flex-1 bg-border" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground/90">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground shadow-none outline-none ring-0 transition-[border-color] focus-visible:border-primary/35 sm:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground/90">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground shadow-none outline-none ring-0 transition-[border-color] focus-visible:border-primary/35 sm:text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm leading-snug text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="dm-pill flex min-h-12 w-full items-center justify-center bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs leading-relaxed text-muted sm:text-left">
        New to Midora Online?{" "}
        <a href="/register" className="font-semibold text-foreground underline-offset-2 hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}

