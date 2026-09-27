"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";
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
    <section className="dm-card space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold">Account</h2>
        <p className="mt-0.5 text-xs text-muted">Change the password for email sign-in, or sign out.</p>
      </div>
      <form onSubmit={handlePassword} className="space-y-3">
        <label className="block space-y-1.5 text-sm font-medium">
          Current password
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
            className="dm-input font-normal"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          New password
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="dm-input font-normal"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className="dm-input font-normal"
          />
        </label>
        {message ? <p className="text-sm text-[color:var(--success)]">{message}</p> : null}
        {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
        <button type="submit" disabled={saving === "password"} className="dm-btn dm-btn-primary min-h-11">
          {saving === "password" ? "Updating…" : "Update password"}
        </button>
      </form>
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="dm-btn dm-btn-secondary min-h-11 text-[color:var(--error)]"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </section>
  );
}
