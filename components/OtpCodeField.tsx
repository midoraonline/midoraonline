"use client";

type Props = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  className?: string;
};

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

/** One field so SMS autofill and paste fill the whole code. */
export default function OtpCodeField({ value, onChange, disabled, id, autoFocus, className = "" }: Props) {
  return (
    <input
      id={id}
      value={value}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]*"
      aria-label="6-digit code"
      placeholder="000000"
      onChange={(e) => onChange(digitsOnly(e.target.value))}
      onPaste={(e) => {
        const text = digitsOnly(e.clipboardData.getData("text"));
        if (!text) return;
        e.preventDefault();
        onChange(text);
      }}
      className={`dm-input dm-focus w-full text-center text-lg font-semibold tracking-[0.4em] tabular-nums ${className}`.trim()}
    />
  );
}
