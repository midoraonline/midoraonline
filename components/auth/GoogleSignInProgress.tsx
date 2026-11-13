"use client";

import { AlertCircle, Loader2 } from "lucide-react";

export type GoogleProgressStatus = "processing" | "success" | "error";

/** How long the success state stays up before the caller navigates away. */
export const GOOGLE_SUCCESS_HOLD_MS = 900;

const STEPS = ["Confirming with Google", "Setting up your session"] as const;

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Badge({ status }: { status: GoogleProgressStatus }) {
  if (status === "success") {
    return (
      <span className="auth-check-pop relative grid size-20 place-items-center rounded-full bg-[color:var(--success-subtle)] text-[color:var(--success)]">
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path className="auth-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="grid size-20 place-items-center rounded-full bg-[color:var(--error-subtle)] text-[color:var(--error)]">
        <AlertCircle className="size-9" aria-hidden />
      </span>
    );
  }
  return (
    <span className="relative grid size-20 place-items-center">
      <span className="auth-ring-ping absolute inset-0 rounded-full bg-accent/25" aria-hidden />
      <span className="absolute inset-0 rounded-full border-[3px] border-border" aria-hidden />
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-accent" aria-hidden />
      <span className="relative grid size-14 place-items-center rounded-full bg-surface shadow-sm">
        <GoogleMark className="size-7" />
      </span>
    </span>
  );
}

/**
 * Full-card progress screen for returning from Google. `step` is 0-based while processing;
 * success holds for GOOGLE_SUCCESS_HOLD_MS with a progress bar so the redirect feels intentional.
 */
export default function GoogleSignInProgress({
  status,
  step = 0,
  title,
  message,
  onRetry,
  retrying = false,
  secondary,
}: {
  status: GoogleProgressStatus;
  step?: number;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  secondary?: React.ReactNode;
}) {
  const heading =
    title ??
    (status === "success" ? "You're signed in" : status === "error" ? "Couldn't sign you in" : "Signing you in");
  const body =
    message ??
    (status === "success"
      ? "Welcome to Midora. Taking you to the marketplace…"
      : status === "error"
        ? "Something went wrong while finishing Google sign-in."
        : "This only takes a moment. Please keep this tab open.");

  return (
    <div className="w-full text-center" role="status" aria-live="polite" aria-busy={status === "processing"}>
      <div className="mx-auto mb-6 grid place-items-center">
        <Badge status={status} />
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{heading}</h1>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{body}</p>

      {status === "processing" ? (
        <ol className="mx-auto mt-6 max-w-xs space-y-2.5 text-left">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors ${
                    done
                      ? "bg-[color:var(--success)] text-white"
                      : active
                        ? "bg-accent/10 text-accent"
                        : "bg-surface-muted text-muted"
                  }`}
                  aria-hidden
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={done ? "text-muted" : active ? "font-medium text-foreground" : "text-muted"}>{label}</span>
                <span className="sr-only">{done ? "done" : active ? "in progress" : "waiting"}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {status === "success" ? (
        <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <div
            className="auth-progress-fill h-full rounded-full bg-[color:var(--success)]"
            style={{ ["--auth-progress-ms" as string]: `${GOOGLE_SUCCESS_HOLD_MS}ms` }}
          />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mx-auto mt-6 max-w-xs space-y-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="dm-btn dm-btn-primary min-h-11 w-full"
            >
              {retrying ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Starting…
                </>
              ) : (
                "Try Google again"
              )}
            </button>
          ) : null}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
