"use client";

import { useState } from "react";
import { apiAuth } from "@/lib/api";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

// ── Status banner ─────────────────────────────────────────────────────────────
function Banner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
      type === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
        : "border-rose-500/30 bg-rose-500/10 text-rose-700"
    }`}>
      <MaterialSymbol
        name={type === "success" ? "check_circle" : "error"}
        className="!text-base shrink-0"
      />
      {message}
    </div>
  );
}

// ── Password section ──────────────────────────────────────────────────────────
function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (next !== confirm) {
      setStatus({ type: "error", message: "New passwords don't match." });
      return;
    }
    if (next.length < 8) {
      setStatus({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    setSaving(true);
    try {
      await apiAuth.changePassword({ current_password: current, new_password: next });
      setStatus({ type: "success", message: "Password changed successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dm-card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <MaterialSymbol name="lock" className="!text-lg" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Change password</h2>
          <p className="text-xs text-muted">Keep your account secure with a strong password.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Current password */}
        <div className="space-y-1.5">
          <label htmlFor="current-pw" className="block text-sm font-medium text-foreground/80">
            Current password
          </label>
          <div className="relative">
            <input
              id="current-pw"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none transition focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <MaterialSymbol name={showCurrent ? "visibility_off" : "visibility"} className="!text-base" />
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="new-pw" className="block text-sm font-medium text-foreground/80">
            New password
          </label>
          <div className="relative">
            <input
              id="new-pw"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none transition focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <MaterialSymbol name={showNext ? "visibility_off" : "visibility"} className="!text-base" />
            </button>
          </div>
          {/* Strength bar */}
          {next.length > 0 && (
            <div className="flex items-center gap-2">
              {[4, 8, 12].map((threshold) => (
                <div
                  key={threshold}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    next.length >= threshold ? "bg-accent" : "bg-border"
                  }`}
                />
              ))}
              <span className="text-[10px] text-muted">
                {next.length < 4 ? "Weak" : next.length < 8 ? "Fair" : next.length < 12 ? "Good" : "Strong"}
              </span>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-pw" className="block text-sm font-medium text-foreground/80">
            Confirm new password
          </label>
          <input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className={`min-h-10 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-accent/10 ${
              confirm && confirm !== next
                ? "border-rose-400 focus-visible:border-rose-400"
                : "border-border focus-visible:border-accent/50"
            }`}
          />
          {confirm && confirm !== next && (
            <p className="text-xs text-rose-600">Passwords don&apos;t match.</p>
          )}
        </div>

        {status && <Banner type={status.type} message={status.message} />}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || (!!confirm && confirm !== next)}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ── Account info (read-only) ──────────────────────────────────────────────────
function AccountInfoSection() {
  const session = useAppSession();
  const user = session.user;
  if (!user) return null;

  const rows = [
    { label: "Account ID",     value: user.id.slice(0, 8) + "…" },
    { label: "Role",           value: user.user_role ?? "—" },
    { label: "Email verified", value: user.email_verified ? "Yes" : "No" },
  ];

  return (
    <section className="dm-card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <MaterialSymbol name="info" className="!text-lg" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Account info</h2>
          <p className="text-xs text-muted">Read-only details about your account.</p>
        </div>
      </div>
      <dl className="divide-y divide-border">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium capitalize">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CustomerSettingsPage() {
  return (
    <div className="space-y-5">
      <PasswordSection />
      <AccountInfoSection />
    </div>
  );
}
