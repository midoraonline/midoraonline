"use client";

import { useEffect, useState } from "react";
import { apiAuth } from "@/lib/api";
import { migrationRequired } from "@/lib/accountPreferences";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import VerifyContactButton from "@/components/VerifyContactButton";

export default function ProfileSettings() {
  const session = useAppSession();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.user) return;
    setFullName(session.user.full_name ?? "");
    setBio(session.user.bio ?? "");
    setPhone(session.user.phone_number ?? "");
    setPhoneVerified(Boolean(session.user.phone_verified));
  }, [session.user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const profile = {
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      bio: bio.trim(),
    };
    try {
      try {
        await apiAuth.updateProfile(profile);
      } catch (err) {
        if (!migrationRequired(err)) throw err;
        await apiAuth.updateProfile({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
        });
        notifyAuthChanged();
        setMessage("Name and phone saved. Bio isn’t available until the account update is applied.");
        return;
      }
      notifyAuthChanged();
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dm-card space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold">Profile</h2>
        <p className="mt-0.5 text-xs text-muted">Your name, bio, phone, and photo.</p>
      </div>
      <ProfileAvatarUpload />
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="settings-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="settings-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className="dm-input"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="settings-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="settings-email"
            value={session.user?.email ?? ""}
            disabled
            className="dm-input disabled:opacity-60"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="settings-bio" className="block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="settings-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            placeholder="A short line about you"
            className="dm-textarea"
          />
          <p className="text-xs text-muted">{bio.length}/500</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="settings-phone" className="block text-sm font-medium">
            Phone
          </label>
          <PhoneNumberInput id="settings-phone" value={phone} onChange={setPhone} autoComplete="tel" />
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
        {message ? <p className="text-sm text-[color:var(--success)]">{message}</p> : null}
        {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
        <button type="submit" disabled={saving} className="dm-btn dm-btn-primary min-h-11">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
