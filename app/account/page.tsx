"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Awaited<ReturnType<typeof apiAuth.me>> | null>(
    null
  );

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("midora_access_token")
        : null;
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await apiAuth.me(token);
        if (cancelled) return;
        setUser(me);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load your account."
        );
        setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("midora_access_token");
      window.localStorage.removeItem("midora_refresh_token");
      window.dispatchEvent(new Event("midora-auth-changed"));
    }
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-muted">
          Manage your Midora Online profile and session.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="dm-card p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold tracking-tight">Profile</p>
            <p className="mt-1 text-xs text-muted">
              Basic information about your account.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading your profile…</p>
          ) : user ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-foreground/90">Name: </span>
                {user.full_name || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-foreground/90">Email: </span>
                {user.email}
              </p>
              <p>
                <span className="font-semibold text-foreground/90">Role: </span>
                {user.user_role || "customer"}
              </p>
              <p>
                <span className="font-semibold text-foreground/90">
                  Email verified:{" "}
                </span>
                {user.email_verified ? "Yes" : "No"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              You&apos;re not signed in.{" "}
              <a
                href="/login"
                className="font-semibold text-foreground/80 hover:text-foreground"
              >
                Log in
              </a>
              .
            </p>
          )}

          {error ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="dm-pill dm-focus border border-border bg-surface hover:bg-foreground/5 text-sm font-semibold px-4 py-2"
          >
            Logout
          </button>
        </div>

        <div className="dm-card p-6 space-y-3">
          <p className="text-sm font-semibold tracking-tight">Session</p>
          <p className="text-xs text-muted">
            This area can later show your active shops, subscriptions, and recent
            AI chats. For now it&apos;s a simple placeholder.
          </p>
        </div>
      </section>
    </div>
  );
}

