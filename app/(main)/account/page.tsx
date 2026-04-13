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
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Account</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Manage your Midora Online profile and session.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="dm-card space-y-5 p-6 sm:p-7">
          <div>
            <p className="text-sm font-semibold tracking-tight">Profile</p>
            <p className="mt-1 text-xs text-muted">
              Basic information about your account.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading your profile…</p>
          ) : user ? (
            <div className="space-y-2.5 text-sm">
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
                className="font-semibold text-foreground/85 underline-offset-2 hover:underline"
              >
                Log in
              </a>
              .
            </p>
          )}

          {error ? (
            <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-3 py-2 text-xs text-red-700 backdrop-blur-sm">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="dm-pill dm-focus bg-foreground/[0.07] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            Logout
          </button>
        </div>

        <div className="dm-card space-y-3 p-6 sm:p-7">
          <p className="text-sm font-semibold tracking-tight">Session</p>
          <p className="text-xs leading-relaxed text-muted sm:text-sm">
            This area can later show your active shops, subscriptions, and recent
            AI chats. For now it&apos;s a simple placeholder.
          </p>
        </div>
      </section>
    </div>
  );
}
