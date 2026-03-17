"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Sign in to Midora Online</h1>
      <p className="mt-2 text-sm text-muted">
        Access your shops, products, and subscriptions.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity justify-center h-11"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-muted">
        New to Midora Online?{" "}
        <a href="/register" className="font-semibold text-foreground/80 hover:text-foreground">
          Create an account
        </a>
      </p>
    </div>
  );
}

