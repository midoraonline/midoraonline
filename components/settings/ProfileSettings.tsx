"use client";

import { BTN_PRIMARY } from "@/components/dashboard/ui";
import { SettingsActions, SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
import { useEffect, useState } from "react";
import { apiAuth } from "@/lib/api";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { useAppSession } from "@/lib/state";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import VerifyContactButton from "@/components/VerifyContactButton";
import { confirmPhoneCode, startPhoneVerification, verificationMessage } from "@/lib/verification";

export default function ProfileSettings() {
  const session = useAppSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.user) return;
    setFullName(session.user.full_name ?? "");
    setPhone(session.user.phone_number ?? "");
    setPhoneVerified(Boolean(session.user.phone_verified));
  }, [session.user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiAuth.updateProfile({ full_name: fullName.trim() });
      notifyAuthChanged();
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <SettingsPanel>
        <SettingsRow title="Photo" description="Shown on your reviews, messages and seller profile.">
          <ProfileAvatarUpload />
        </SettingsRow>
        <SettingsRow title="Personal details" description="Your name as buyers and sellers see it.">
          <div className="grid gap-4 md:grid-cols-2">
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
              <p className="text-xs text-muted">Used to sign in. It can&apos;t be changed here.</p>
            </div>
          </div>
        </SettingsRow>
        <SettingsRow
          title="Phone verification"
          description="We text you a code. A verified number lets buyers trust WhatsApp contact from you."
        >
          <div className="space-y-2 md:max-w-md">
            <label htmlFor="settings-phone" className="sr-only">
              Phone
            </label>
            <PhoneNumberInput id="settings-phone" value={phone} onChange={setPhone} autoComplete="tel" />
            <VerifyContactButton
              value={phone}
              verified={phoneVerified && phone.trim() === (session.user?.phone_number ?? "").trim()}
              label="phone number"
              sendCode={async () => {
                try {
                  await startPhoneVerification(phone.trim());
                } catch (err) {
                  throw new Error(verificationMessage(err));
                }
              }}
              confirmCode={async (code) => {
                try {
                  const status = await confirmPhoneCode(phone.trim(), code);
                  setPhone(status.phone ?? phone);
                  setPhoneVerified(Boolean(status.phone_verified));
                } catch (err) {
                  throw new Error(verificationMessage(err));
                }
              }}
              onSuccess={() => notifyAuthChanged()}
            />
          </div>
        </SettingsRow>
        <SettingsActions>
          {message ? <p className="mr-auto text-sm text-[color:var(--success)]">{message}</p> : null}
          {error ? <p className="mr-auto text-sm text-[color:var(--error)]">{error}</p> : null}
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? "Saving…" : "Save name"}
          </button>
        </SettingsActions>
      </SettingsPanel>
    </form>
  );
}
