"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Show the leading lock icon (auth pages). */
  withIcon?: boolean;
};

/** Shared password field with a show/hide eye toggle. */
const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { withIcon = true, className = "", ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {withIcon ? (
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      ) : null}
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`min-h-11 w-full rounded-xl border border-border bg-surface ${
          withIcon ? "pl-10" : "pl-3.5"
        } pr-11 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/10 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

export default PasswordInput;
