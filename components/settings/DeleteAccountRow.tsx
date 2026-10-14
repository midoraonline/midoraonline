"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import FormModal from "@/components/FormModal";
import { SettingsRow } from "@/components/settings/SettingsSection";
import { apiAuth } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";

export default function DeleteAccountRow() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await apiAuth.deleteMyAccount();
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
          <div className="space-y-3 text-sm text-foreground">
            <p>
              Your profile, businesses, ads, photos and saved settings will be deleted. Chats with other people may
              keep your messages, shown as from a deleted user.
            </p>
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
