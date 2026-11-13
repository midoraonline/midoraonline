"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BTN_SECONDARY, CARD } from "@/components/dashboard/ui";
import { getWhatsAppStatus, type WhatsAppStatus } from "@/lib/api/admin";

/** Admin: ask Meta whether WhatsApp verification codes can be sent, and why not. */
export default function WhatsAppConnectionCard() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setError(null);
    try {
      setStatus(await getWhatsAppStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run the check.");
    } finally {
      setChecking(false);
    }
  }

  const tone = !status
    ? "bg-surface-muted text-muted"
    : status.ready
      ? "bg-[color:var(--success-subtle)] text-[color:var(--success)]"
      : "bg-[color:var(--warning-subtle)] text-[color:var(--warning)]";

  return (
    <section className={`${CARD} p-4 sm:p-5`} aria-live="polite">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--success-subtle)] text-[color:var(--success)]">
          <WhatsAppIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">WhatsApp connection</h2>
          <p className="text-sm text-muted">
            Checks the token, phone number and code template with Meta. Shops can verify their WhatsApp only when all three
            pass.
          </p>
        </div>
        <button type="button" onClick={() => void check()} disabled={checking} className={BTN_SECONDARY}>
          {checking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
          {checking ? "Checking…" : status ? "Check again" : "Check connection"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-[color:var(--error)]">{error}</p> : null}

      {status ? (
        <div className="mt-4 space-y-3">
          <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {status.ready ? "Active: codes can be sent" : "Not active yet"}
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {status.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--success)]" aria-label="Passed" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-[color:var(--warning)]" aria-label="Not passed" />
                )}
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{c.label}</span>
                  <span className="block break-words text-muted">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {status.template ? (
            <p className="text-xs text-muted">
              Template <span className="font-medium text-foreground">{status.template.name}</span> ·{" "}
              {status.template.category} · {status.template.language} · {status.template.status}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
