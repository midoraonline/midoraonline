"use client";

import { Phone, Plus, Trash2 } from "lucide-react";

import PhoneNumberInput from "@/components/PhoneNumberInput";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { Contact } from "@/lib/api/shops";

export const MAX_EXTRA_PHONES = 3;

export type ExtraPhone = { value: string; label: string; whatsapp: boolean };

export function extraPhonesFromContacts(contacts: Contact[] | null | undefined): ExtraPhone[] {
  return (contacts ?? [])
    .filter((c) => c.value?.trim() && (c.type === "phone" || c.type === "whatsapp"))
    .map((c) => ({ value: c.value.trim(), label: c.label ?? "", whatsapp: c.type === "whatsapp" }));
}

export function extraPhonesToContacts(phones: ExtraPhone[]): Contact[] {
  return phones
    .filter((p) => p.value.trim())
    .map((p) => ({ type: p.whatsapp ? "whatsapp" : "phone", label: p.label.trim() || null, value: p.value.trim() }));
}

type Props = {
  value: ExtraPhone[];
  onChange: (next: ExtraPhone[]) => void;
  idPrefix?: string;
};

/** Up to three more numbers buyers can call; one may be marked as WhatsApp (shown as not verified). */
export default function ExtraPhoneNumbers({ value, onChange, idPrefix = "extra-phone" }: Props) {
  const update = (i: number, patch: Partial<ExtraPhone>) =>
    onChange(
      value.map((p, j) => {
        if (j === i) return { ...p, ...patch };
        // Only one extra number can be the WhatsApp one.
        return patch.whatsapp ? { ...p, whatsapp: false } : p;
      }),
    );

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Other phone numbers</p>
        <span className="text-[11px] tabular-nums text-muted">
          {value.length}/{MAX_EXTRA_PHONES}
        </span>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-muted">Add numbers buyers can call, like a second line or a branch.</p>
      ) : null}
      <ul className="space-y-2">
        {value.map((phone, i) => (
          <li key={i} className="space-y-2 rounded-xl border border-border bg-surface-subtle p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <PhoneNumberInput
                  id={`${idPrefix}-${i}`}
                  value={phone.value}
                  onChange={(v) => update(i, { value: v })}
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="dm-focus grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[color:var(--error-subtle)] hover:text-[color:var(--error)]"
                aria-label="Remove number"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="dm-input !h-9 min-w-0 flex-1 text-sm"
                placeholder="Label, e.g. Branch or Manager"
                maxLength={40}
                value={phone.label}
                onChange={(e) => update(i, { label: e.target.value })}
                aria-label="Label for this number"
              />
              <button
                type="button"
                role="switch"
                aria-checked={phone.whatsapp}
                onClick={() => update(i, { whatsapp: !phone.whatsapp })}
                className={`dm-focus inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  phone.whatsapp
                    ? "border-[color:var(--success)] bg-[color:var(--success-subtle)] text-[color:var(--success)]"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {phone.whatsapp ? <WhatsAppIcon className="size-3.5" /> : <Phone className="size-3.5" aria-hidden />}
                {phone.whatsapp ? "WhatsApp" : "Calls only"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {value.length < MAX_EXTRA_PHONES ? (
        <button
          type="button"
          onClick={() => onChange([...value, { value: "", label: "", whatsapp: false }])}
          className="dm-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="size-3.5" aria-hidden /> Add a number
        </button>
      ) : null}
      {value.some((p) => p.whatsapp) ? (
        <p className="text-[11px] text-muted">
          Extra WhatsApp numbers aren&apos;t verified, so buyers see them marked as not verified.
        </p>
      ) : null}
    </div>
  );
}
