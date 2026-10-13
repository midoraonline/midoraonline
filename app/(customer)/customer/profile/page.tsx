"use client";

import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import { useEffect, useState } from "react";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import { BTN_PRIMARY, PageHeader, PageSkeleton } from "@/components/dashboard/ui";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import VerifyContactButton from "@/components/VerifyContactButton";

function Banner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <p
      className={`text-sm ${type === "success" ? "text-[color:var(--success)]" : "text-[color:var(--error)]"}`}
    >
      {message}
    </p>
  );
}

export default function CustomerProfilePage() {
  const session = useAppSession();
  const user = session.user ?? null;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone_number ?? "");
      setPhoneVerified(Boolean(user.phone_verified));
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
    return <PageSkeleton rows={4} label="Loading your profile" />;
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your photo, name and phone number." />
      <div className="space-y-4">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">

        <ProfileAvatarUpload />

        <div>

          <p className="text-sm font-semibold">{user.full_name || "No name set"}</p>

          <p className="text-sm text-muted">{user.email}</p>

        </div>

      </section>

      {/* Editable profile */}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="mb-5">
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
              className="h-10 w-full rounded-lg border border-border bg-surface shadow-xs px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground/80">Email</label>
            <input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="h-10 w-full rounded-lg border border-border bg-surface shadow-xs px-3 text-sm text-foreground/50 outline-none cursor-not-allowed"
            />
            <p className="text-xs text-muted">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-medium text-foreground/80">Phone number</label>
            <PhoneNumberInput
              id="phone"
              value={phone}
              onChange={setPhone}
              placeholder="700 000 000"
              autoComplete="tel"
            />
            <VerifyContactButton
              value={phone}
              verified={phoneVerified}
              label="phone number"
              sendCode={() => apiAuth.sendPhoneVerificationCode({ phone_number: phone.trim() })}
              confirmCode={async (code) => {
                const updated = await apiAuth.confirmPhoneVerificationCode(code);
                setPhone(updated.phone_number ?? phone);
                setPhoneVerified(Boolean(updated.phone_verified));
              }}
              onSuccess={() => notifyAuthChanged()}
            />
          </div>

          {status && <Banner type={status.type} message={status.message} />}

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className={BTN_PRIMARY}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Read-only account info */}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="mb-4">
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
    </div>
  );
}
