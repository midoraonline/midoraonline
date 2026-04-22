"use client";

import Image from "next/image";

import { useAppSession } from "@/lib/state";

export default function CustomerProfilePage() {
  const session = useAppSession();
  const user = session.user ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          My profile
        </h1>
      </header>

      <section className="dm-card p-5 sm:p-6">
        {user ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {user.avatar_url ? (
                <div className="relative size-20 overflow-hidden rounded-full border border-border bg-foreground/[0.04]">
                  <Image
                    src={user.avatar_url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid size-20 place-items-center rounded-full bg-foreground/[0.08] text-lg font-bold text-foreground/70">
                  {(user.full_name || user.email || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
              <ProfileItem label="Name" value={user.full_name || "—"} />
              <ProfileItem label="Email" value={user.email || "—"} />
              <ProfileItem label="Phone" value={user.phone_number || "—"} />
              <ProfileItem
                label="Role"
                value={(user.user_role || "customer").toUpperCase()}
              />
              <ProfileItem
                label="Email verified"
                value={
                  user.email_verified === true
                    ? "Yes"
                    : user.email_verified === false
                    ? "No"
                    : "Unknown"
                }
              />
              <ProfileItem label="User ID" value={user.id.slice(0, 12) + "…"} />
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted">Loading your profile…</p>
        )}
      </section>

      <p className="text-xs text-muted">
        Profile editing is coming soon. In the meantime, you can log out and back in to
        refresh your session.
      </p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
