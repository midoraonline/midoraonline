"use client";

import { BTN_PRIMARY } from "@/components/dashboard/ui";
import { SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import DeleteAccountRow from "@/components/settings/DeleteAccountRow";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AccountSecuritySettings() {
  const router = useRouter();
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving("password");
    try {
      await apiAuth.changePassword({ current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage("Password updated.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not change password.";
      setError(
        /incorrect/i.test(text)
          ? "Current password is incorrect. Google sign-in accounts do not use a password here."
          : text,
      );
    } finally {
      setSaving("");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SettingsPanel>
      <SettingsRow
        title="Password"
        description="For email sign-in. Google sign-in accounts don't use a password here."
      >
        <form onSubmit={handlePassword} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium md:col-span-2 md:max-w-[calc(50%-0.5rem)]">
              Current password
              <PasswordInput
                withIcon={false}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
                className="font-normal"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              New password
              <PasswordInput
                withIcon={false}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="font-normal"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Confirm new password
              <PasswordInput
                withIcon={false}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="font-normal"
              />
            </label>
          </div>
          {message ? <p className="text-sm text-[color:var(--success)]">{message}</p> : null}
          {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
          <button type="submit" disabled={saving === "password"} className={BTN_PRIMARY}>
            {saving === "password" ? "Saving…" : "Save"}
          </button>
        </form>
      </SettingsRow>
      <SettingsRow title="Sign out" description="Ends your session on this device.">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="dm-btn dm-btn-secondary min-h-10 text-[color:var(--error)]"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </SettingsRow>
      <DeleteAccountRow />
    </SettingsPanel>
  );
}
