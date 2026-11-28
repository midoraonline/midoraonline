"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import OtpCodeField from "@/components/OtpCodeField";
import { BTN_SECONDARY } from "@/components/dashboard/ui";
import { INPUT } from "@/components/post/StepFrame";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import {
  confirmEmailCode,
  startEmailVerification,
  verificationMessage,
  type VerificationStatus,
} from "@/lib/verification";

/** Account email (verify inline with the email code flow) + optional public shop email. */
export default function EmailContactRow({
  address,
  verified,
  shopEmail,
  onShopEmailChange,
  canEditShopEmail,
  onVerified,
}: {
  address: string | null;
  verified: boolean;
  shopEmail: string;
  onShopEmailChange: (next: string) => void;
  canEditShopEmail: boolean;
  onVerified: (status: VerificationStatus) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublic, setShowPublic] = useState(Boolean(shopEmail));

  async function send() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await startEmailVerification(address);
      setPhase("code");
      setCode("");
    } catch (err) {
      setError(verificationMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(digits: string) {
    if (!address || digits.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const status = await confirmEmailCode(address, digits);
      notifyAuthChanged();
      setPhase("idle");
      onVerified(status);
    } catch (err) {
      setError(verificationMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Mail className="size-4 text-muted" aria-hidden /> Email
      </p>
      {address ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
            {verified ? <CheckCircle2 className="size-4 shrink-0 text-[color:var(--success)]" aria-label="Verified" /> : null}
            <span className="truncate">{address}</span>
          </p>
          {!verified && phase === "idle" ? (
            <button type="button" onClick={() => void send()} disabled={busy} className={BTN_SECONDARY}>
              {busy ? "Sending…" : "Verify email"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">No email on your account yet.</p>
      )}
      {phase === "code" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">Enter the 6-digit code we sent to {address}.</p>
          <OtpCodeField
            value={code}
            onChange={(digits) => {
              setCode(digits);
              if (digits.length === 6) void confirm(digits);
            }}
            disabled={busy}
            autoFocus
          />
        </div>
      ) : null}
      {error ? <p className="text-xs text-[color:var(--error)]" role="alert">{error}</p> : null}
      {canEditShopEmail ? (
        showPublic ? (
          <div className="space-y-1.5">
            <label htmlFor="contacts-shop-email" className="block text-sm font-medium text-foreground">
              Public email <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="contacts-shop-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={INPUT}
              value={shopEmail}
              onChange={(e) => onShopEmailChange(e.target.value)}
              placeholder="e.g. hello@yourshop.com"
            />
            <p className="text-xs text-muted">Buyers see this instead of your account email.</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPublic(true)}
            className="dm-focus rounded text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Use a different public email
          </button>
        )
      ) : null}
    </div>
  );
}
