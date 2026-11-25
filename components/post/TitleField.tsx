"use client";

import { TITLE_HARD_LIMIT, TITLE_SOFT_LIMIT } from "@/lib/listingIntent";

/**
 * Title input with v1.2 guidance: live counter, soft warning after 50, hard max 80.
 * Legacy titles over 80 still load; they can only be shortened.
 */
export default function TitleField({
  id = "product-title",
  value,
  onChange,
  placeholder,
  error,
  inputClassName,
  required,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string | null;
  inputClassName: string;
  required?: boolean;
}) {
  const length = value.trim().length;
  const over = length > TITLE_SOFT_LIMIT;
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        Title{required ? <span className="text-[color:var(--error)]"> *</span> : null}
      </label>
      <input
        id={id}
        className={inputClassName}
        value={value}
        // Typing past 80 is blocked; deleting always works for older, longer titles.
        maxLength={Math.max(TITLE_HARD_LIMIT, value.length)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={hintId}
        required={required}
      />
      <div id={hintId} className="flex items-start justify-between gap-3 text-xs">
        <p className={over ? "text-amber-700 dark:text-amber-300" : "text-muted"}>
          {over
            ? `Shorter titles read better on cards. Recommended: ${TITLE_SOFT_LIMIT} characters or fewer, maximum ${TITLE_HARD_LIMIT}.`
            : "Keep the title clear and specific. Recommended: 50 characters or fewer."}
          <span className="mt-0.5 block text-muted">
            Example: &ldquo;Business name registration help&rdquo; instead of a long sentence.
          </span>
        </p>
        <span
          className={`shrink-0 tabular-nums ${length > TITLE_HARD_LIMIT ? "text-[color:var(--error)]" : over ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}
          aria-live="polite"
        >
          {length}/{TITLE_SOFT_LIMIT}
        </span>
      </div>
      {error ? <p className="text-xs text-[color:var(--error)]" role="alert">{error}</p> : null}
    </div>
  );
}
