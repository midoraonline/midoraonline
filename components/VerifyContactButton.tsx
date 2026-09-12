"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  /** Current value of the phone/WhatsApp field being verified. */
  value: string;
  verified: boolean;
  disabled?: boolean;
  /** Shown in error copy, e.g. "phone number" or "WhatsApp number". */
  label?: string;
  sendCode: () => Promise<unknown>;
  /** Should persist the verified number/flag on success (throws on failure). */
  confirmCode: (code: string) => Promise<unknown>;
  onSuccess?: () => void;
};

/** Inline "Verify" button → OTP code entry, reused for phone (SMS) and WhatsApp checks. */
export default function VerifyContactButton({
  value,
  verified,
  disabled,
  label = "number",
  sendCode,
  confirmCode,
  onSuccess,
}: Props) {
  const [stage, setStage] = useState<"idle" | "sending" | "code" | "confirming">("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!value.trim()) {
      setError(`Enter a ${label} first.`);
      return;
    }
    setError(null);
    setStage("sending");
    try {
      await sendCode();
      setStage("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code.");
      setStage("idle");
    }
  }

  async function handleConfirm(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();
    if (code.trim().length < 4) return;
    setError(null);
    setStage("confirming");
    try {
      await confirmCode(code.trim());
      setCode("");
      setStage("idle");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code.");
      setStage("code");
    }
  }

  if (verified) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <MaterialSymbol name="verified" className="!text-sm" />
        Verified
      </span>
    );
  }

  if (stage === "code" || stage === "confirming") {
    return (
      // Nested inside settings forms — use a div (not <form>) to avoid invalid nested-form HTML.
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm(e);
          }}
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          className="dm-input dm-focus !h-9 !w-32 !py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={stage === "confirming" || code.trim().length < 4}
          className="dm-pill dm-focus bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {stage === "confirming" ? "Checking…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={stage === "confirming"}
          className="text-xs font-medium text-muted underline underline-offset-2 disabled:opacity-60"
        >
          Resend code
        </button>
        {error ? <p className="w-full text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || stage === "sending"}
        className="dm-pill dm-focus border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-60"
      >
        {stage === "sending" ? "Sending…" : "Verify"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
