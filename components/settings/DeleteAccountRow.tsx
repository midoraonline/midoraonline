"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import FormModal from "@/components/FormModal";
import { SettingsRow } from "@/components/settings/SettingsSection";
import { apiAuth } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";

const REASONS = [
  { value: "not_useful", label: "I don't find Midora useful" },
  { value: "too_many_messages", label: "Too many emails or notifications" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "found_alternative", label: "I found another platform" },
  { value: "selling_elsewhere", label: "I stopped selling or buying" },
  { value: "other", label: "Other" },
] as const;

export default function DeleteAccountRow() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");

  function close() {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setError(null);
    setReason("");
    setDetails("");
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await apiAuth.deleteMyAccount({ reason: reason || null, details: details.trim() || null });
      try {
        await logout();
      } catch {
        /* session is already gone server-side */
      }
      toast.success("Your account has been deleted.");
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /last admin/i.test(msg)
          ? "You're the only admin. Make someone else an admin first."
          : "We couldn't delete your account. Try again in a moment.",
      );
      setBusy(false);
    }
  }

  return (
    <SettingsRow
      title="Delete account"
      description="Permanently removes your profile, businesses, ads and photos. This can't be undone."
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dm-btn dm-btn-secondary min-h-10 text-[color:var(--error)]"
      >
        Delete account
      </button>
      {open ? (
        <FormModal
          title="Delete your account?"
          onClose={close}
          maxWidthClass="sm:max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={close} disabled={busy} className="dm-btn dm-btn-ghost dm-btn-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={busy || typed.trim().toUpperCase() !== "DELETE"}
                className="dm-btn dm-btn-primary disabled:opacity-50"
                style={{ background: "var(--error)" }}
              >
                {busy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-foreground">
            <div
              role="alert"
              className="rounded-lg border border-[color:var(--error)]/30 bg-error-subtle px-3 py-2.5 text-[color:var(--error)]"
            >
              <p className="font-semibold">This is permanent and can&apos;t be undone.</p>
              <p className="mt-1">
                Your profile, businesses, ads, photos, followers and saved settings will be deleted. Active plans
                aren&apos;t refunded. Chats with other people may keep your messages, shown as from a deleted user.
              </p>
            </div>
            <fieldset className="space-y-2">
              <legend className="font-medium">
                Why are you leaving? <span className="font-normal text-muted">(optional)</span>
              </legend>
              <div className="grid gap-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border px-3 transition-colors ${
                      reason === r.value ? "border-accent bg-accent/5" : "border-border hover:bg-foreground/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-[color:var(--accent)]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              {reason === "other" ? (
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                  rows={3}
                  placeholder="Tell us more (optional)"
                  className="dm-textarea font-normal"
                  aria-label="Other reason"
                />
              ) : null}
            </fieldset>
            <label className="block space-y-1.5 font-medium">
              Type <span className="font-mono">DELETE</span> to confirm
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="dm-input font-normal"
                aria-invalid={!!error}
              />
            </label>
            {error ? <p className="text-[color:var(--error)]">{error}</p> : null}
          </div>
        </FormModal>
      ) : null}
    </SettingsRow>
  );
}
