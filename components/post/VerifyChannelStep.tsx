"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OtpCodeField from "@/components/OtpCodeField";
import StepFrame from "@/components/post/StepFrame";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { normalizePhone } from "@/lib/phone";
import {
  confirmEmailCode,
  confirmPhoneCode,
  isResendTooSoon,
  startEmailVerification,
  startPhoneVerification,
  verificationMessage,
  type VerificationStatus,
} from "@/lib/verification";

const RESEND_SECONDS = 60;

export default function VerifyChannelStep({
  status,
  onVerified,
  onBack,
}: {
  status: VerificationStatus;
  onVerified: (next: VerificationStatus) => void;
  onBack: () => void;
}) {
  const channel = status.required_channel === "email" ? "email" : "phone";
  const [phone, setPhone] = useState(status.phone?.trim() || "");
  const email = status.email?.trim() || "";
  const [phase, setPhase] = useState<"entry" | "code">("entry");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  function canonicalPhone(): string {
    return normalizePhone(phone);
  }

  async function send() {
    setError(null);
    setBusy(true);
    busyRef.current = true;
    try {
      if (channel === "phone") {
        const next = canonicalPhone();
        setPhone(next);
        await startPhoneVerification(next);
      } else {
        await startEmailVerification(email);
      }
      setPhase("code");
      setCode("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(verificationMessage(err));
      if (isResendTooSoon(err)) setResendIn(RESEND_SECONDS);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function confirm(next: string) {
    if (next.length !== 6 || busyRef.current) return;
    setError(null);
    setBusy(true);
    busyRef.current = true;
    try {
      const updated =
        channel === "phone"
          ? await confirmPhoneCode(canonicalPhone(), next)
          : await confirmEmailCode(email, next);
      notifyAuthChanged();
      onVerified(updated);
    } catch (err) {
      setError(verificationMessage(err));
      busyRef.current = false;
      setBusy(false);
    }
  }

  const title =
    phase === "code"
      ? "Enter the code"
      : channel === "phone"
        ? "Verify your phone"
        : "Verify your email";
  const subtitle =
    phase === "code"
      ? channel === "phone"
        ? `We sent a 6-digit code by SMS to ${phone}.`
        : `We sent a 6-digit code to ${email}.`
      : channel === "phone"
        ? "Confirm a phone number before you continue. We'll text you a code."
        : "No phone number is on this account, so we'll email you a code instead.";

  return (
    <StepFrame
      title={title}
      subtitle={subtitle}
      onBack={() => {
        if (phase === "code") {
          setPhase("entry");
          setError(null);
          setBusy(false);
          busyRef.current = false;
          return;
        }
        onBack();
      }}
    >
      {phase === "entry" && channel === "phone" ? (
        <div className="space-y-1.5">
          <label htmlFor="post-phone" className="block text-sm font-medium text-foreground">
            Phone number
          </label>
          <input
            id="post-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => {
              try {
                setPhone(normalizePhone(phone));
              } catch {
                /* Keep what they typed until they send. */
              }
            }}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0700 123 456"
            className="dm-input"
          />
          <p className="text-xs text-muted">0700 123 456, 256700123456, and 700123456 all save as +256.</p>
        </div>
      ) : null}

      {phase === "entry" && channel === "email" ? (
        email ? (
          <p className="rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-foreground">
            {email}
          </p>
        ) : (
          <p className="text-sm text-muted">
            Add an email in{" "}
            <Link href="/merchant/settings" className="font-semibold text-accent">
              settings
            </Link>{" "}
            before posting.
          </p>
        )
      ) : null}

      {phase === "code" ? (
        <OtpCodeField
          value={code}
          onChange={(digits) => {
            setCode(digits);
            if (digits.length === 6) void confirm(digits);
          }}
          disabled={busy}
          autoFocus
        />
      ) : null}

      {error ? (
        <p className="text-sm text-[color:var(--error)]" role="alert">
          {error}
        </p>
      ) : null}

      {phase === "entry" ? (
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || (channel === "phone" ? phone.trim().length < 9 : !email)}
          className="dm-btn dm-btn-primary min-h-11 w-full"
        >
          {busy ? "Sending…" : "Send code"}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || resendIn > 0}
            className="dm-focus min-h-11 text-sm font-semibold text-accent disabled:text-muted"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => void confirm(code)}
            disabled={busy || code.length !== 6}
            className="dm-btn dm-btn-primary min-h-11 px-5"
          >
            {busy ? "Checking…" : "Confirm"}
          </button>
        </div>
      )}
    </StepFrame>
  );
}
