"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";

export default function AccountPage() {
  const router = useRouter();
  const session = useAppSession();

  const loading =
    !session.hydrated || (Boolean(session.token) && session.user === undefined);

  const user = session.user ?? null;
  const hasToken = Boolean(session.token);

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
              Basic information from your session (synced app-wide).
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading your profile…</p>
          ) : user ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-foreground/[0.04]">
                    <Image src={user.avatar_url} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-foreground/[0.08] text-xs font-bold text-foreground/50">
                    {(user.full_name || user.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground/95">{user.full_name || "No name on file"}</p>
                  <p className="text-xs text-muted">User ID · {user.id.slice(0, 8)}…</p>
                </div>
              </div>
              <p>
                <span className="font-semibold text-foreground/90">Email: </span>
                {user.email?.trim()
                  ? user.email
                  : "Not returned by the API for this session (profile may omit it)."}
              </p>
              {user.phone_number ? (
                <p>
                  <span className="font-semibold text-foreground/90">Phone: </span>
                  {user.phone_number}
                </p>
              ) : null}
              <p>
                <span className="font-semibold text-foreground/90">Role: </span>
                {user.user_role || "customer"}
              </p>
              <p>
                <span className="font-semibold text-foreground/90">Email verified: </span>
                {user.email_verified === true
                  ? "Yes"
                  : user.email_verified === false
                    ? "No — check your inbox or request a new link from login."
                    : "Unknown"}
              </p>
            </div>
          ) : hasToken && session.profileError ? (
            <p className="text-sm text-muted">
              Your session is stored but the profile could not be loaded. Try signing in again.
            </p>
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

          {session.profileError && hasToken ? (
            <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-3 py-2 text-xs text-red-700 backdrop-blur-sm">
              {session.profileError}
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
            Shop ownership and navigation use the same session state as the rest of the app
            (see header and shop actions). More account tools can plug into this later.
          </p>
        </div>
      </section>
    </div>
  );
}
