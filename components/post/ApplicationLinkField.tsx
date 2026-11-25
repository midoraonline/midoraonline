"use client";

import { APPLICATION_LINK_MAX } from "@/lib/listingIntent";
import { normalizeApplicationLink } from "@/lib/listingIntentForm";

/** Optional https link buyers open from "Apply now". Normalised on blur. */
export default function ApplicationLinkField({
  id = "opportunity-application-link",
  value,
  onChange,
  error,
  inputClassName,
  recommended,
}: {
  id?: string;
  value: string;
  onChange: (next: string | undefined) => void;
  /** Client or server (422 invalid_application_link) message. */
  error?: string | null;
  inputClassName: string;
  /** CTA is Apply now for this category/intent. */
  recommended?: boolean;
}) {
  const local = value.trim() ? normalizeApplicationLink(value).error : null;
  const message = error ?? local;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        Application link <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        className={inputClassName}
        value={value}
        maxLength={APPLICATION_LINK_MAX + 8}
        onChange={(e) => onChange(e.target.value || undefined)}
        onBlur={() => {
          const next = normalizeApplicationLink(value);
          if (next.value && next.value !== value) onChange(next.value);
        }}
        placeholder="https://yourcompany.com/careers"
        aria-invalid={Boolean(message)}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-muted">
        Your website, form or careers page. Buyers tap Apply now to open it.
        {recommended ? null : " Leave it empty and buyers contact you instead."}
      </p>
      {message ? <p className="text-xs text-[color:var(--error)]" role="alert">{message}</p> : null}
    </div>
  );
}
