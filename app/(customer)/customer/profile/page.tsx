"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

function Banner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
      type === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
        : "border-rose-500/30 bg-rose-500/10 text-rose-700"
    }`}>
      <MaterialSymbol name={type === "success" ? "check_circle" : "error"} className="!text-base shrink-0" />
      {message}
    </div>
  );
}

export default function CustomerProfilePage() {
  const session = useAppSession();
  const user = session.user ?? null;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone_number ?? "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await apiAuth.updateProfile({ full_name: fullName.trim(), phone_number: phone.trim() || undefined });
      notifyAuthChanged();
      setStatus({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <p className="text-sm text-muted">Loading your profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Avatar + identity */}
      <section className="dm-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border bg-foreground/[0.04]">
              <Image src={user.avatar_url} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ) : (
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-accent/15 text-xl font-bold text-accent">
              {(user.full_name || user.email || "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-base font-semibold">{user.full_name || "No name set"}</p>
            <p className="text-sm text-muted">{user.email}</p>
            <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              user.email_verified ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
            }`}>
              {user.email_verified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>
      </section>

      {/* Editable profile */}
      <section className="dm-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
            <MaterialSymbol name="person" className="!text-lg" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Edit profile</h2>
            <p className="text-xs text-muted">Update your display name and phone number.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="full-name" className="block text-sm font-medium text-foreground/80">Full name</label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground/80">Email</label>
            <input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground/50 outline-none cursor-not-allowed"
            />
            <p className="text-xs text-muted">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-medium text-foreground/80">Phone number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000 000"
              autoComplete="tel"
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10"
            />
          </div>

          {status && <Banner type={status.type} message={status.message} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Read-only account info */}
      <section className="dm-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
            <MaterialSymbol name="info" className="!text-lg" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Account info</h2>
            <p className="text-xs text-muted">Read-only details about your account.</p>
          </div>
        </div>
        <dl className="divide-y divide-border">
          {[
            { label: "Account ID", value: user.id.slice(0, 8) + "…" },
            { label: "Role",       value: user.user_role ?? "customer" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
